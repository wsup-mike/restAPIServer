const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const io = require("../socket");

const Post = require("../models/post");
const User = require("../models/user");

// getPosts - Using async await for asynchronous operations
exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2; // Default # posts to display
  // let totalItems; // used to det. total # items in database

  const totalItems = await Post.find().countDocuments();

  try {
    const posts = await Post.find()
      .populate("creator")
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: "Fetched posts successfully.",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// exports.getPosts = (req, res, next) => {
//   //Pagination setup (2 posts per page)
//   const currentPage = req.query.page || 1;
//   const perPage = 2; // Default # posts to display
//   let totalItems; // used to det. total # items in database

//   // Add new Mongoose find() request: total # records
//   Post.find()
//     .countDocuments()
//     .then((count) => {
//       totalItems = count;

//       // Mongoose req. to get all posts in database to render
//       return Post.find()
// .populate('creator')
//         .skip((currentPage - 1) * perPage)
//         .limit(perPage);
//     })
//     .then((posts) => {
//       res.status(200).json({
//         message: "All existing posts fetched successfully!",
//         posts: posts,
//         totalItems: totalItems,
//       });
//     })
//     .catch((err) => {
//       if (!err.statusCode) {
//         err.statusCode = 500;
//       }
//       next(err);
//     });
// };

exports.createPost = (req, res, next) => {
  // first validate the inputs for the new post
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(
      "Data validation error! Entered data does NOT meet the requirements!"
    );
    error.statusCode = 422;
    throw error;
  }

  //  w/ multer now registered, can now first check if an img was first uploaded
  if (!req.file) {
    const error = new Error("File image upload required to create a post");
    error.statusCode = 422;
    throw error;
  }
  // Added as workaround to issue loading images
  const imageUrl = req.file.path.replace("\\", "/");

  // extract info from req body
  const title = req.body.title;
  const content = req.body.content;

  let creator;

  // Setup the model used to create a post
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl, // now to replace the dummy data with actual file upload
    creator: req.userId, // to get the userId
  });

  // steps to officially create new post in db
  post
    .save()
    .then((result) => {
      console.log(result);
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then((result) => {
      // To use getIO()
      io.getIO().emit("posts", {
        action: "create",
        post: post,
      });

      res.status(201).json({
        message: "Post created successfully!",
        post: post,
        creator: { _id: creator._id, name: creator.name },
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post!");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        message: "Post fetched.",
        post: post,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// To Edit an existing post (We will create shortly!)
// Added as workaround to issue loading images
exports.updatePost = (req, res, next) => {
  const postId = req.params.postId; // To extract the postId from the req params

  // first validate the inputs for the new post
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(
      "Data validation error! Entered data does NOT meet the requirements!"
    );
    error.statusCode = 422;
    throw error;
  }

  const title = req.body.title; // To extract the the title from req body
  const content = req.body.content; // to extract the content from body
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path.replace("\\", "/"); // From the workaround
  }

  if (!imageUrl) {
    // a validation
    const error = new Error("No image file chosen.");
    error.statusCode = 422;
    throw error;
  }

  // Now to update the database using the Post model and Mongoose' findById()
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        // First check if a existing post found
        const error = new Error("Cant find the existing post");
        error.statusCode = 500;
        throw error;
      }

      // Next, to verify if 'creator' of the post is equal to userId of the request (requestor)
      if (post.creator.toString() !== req.userId) {
        const error = new Error("Not authorized to edit or delete post.");
        error.statusCode = 403;
        throw error;
      }

      // but if they ARE the 'creator'...

      // 1st check imageUrl of the prior existing post (To use new helper)
      if (imageUrl !== post.imageUrl) {
        // meaning it changed...
        clearImage(post.imageUrl);
      }
      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then((result) => {
      res.status(200).json({
        message: "Post updated!",
        post: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      // 1st check if post exists in database
      if (!post) {
        const error = new Error("Could not find post.");
        error.statusCode = 400;
        throw error;
      }

      // Next, to verify if 'creator' of the post is equal to userId of the request (requestor)
      if (post.creator.toString() !== req.userId) {
        const error = new Error("Not authorized to edit or delete post.");
        error.statusCode = 403;
        throw error;
      }

      // but if they ARE the 'creator'...they can proceed with deletion

      // Clear out the post's image stored
      clearImage(post.imageUrl);

      // To formally delete post from database
      return Post.findByIdAndDelete(postId);
    })
    .then((result) => {
      // To 'pull our the reference' to original user of post
      return User.findById(req.userId);
    })
    .then((user) => {
      user.posts.pull(postId);
      return user.save();
    })
    .then((result) => {
      res.status(200).json({
        message: "Post has sucessfully been deleted!",
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
