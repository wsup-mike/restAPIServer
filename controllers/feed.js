const { validationResult } = require("express-validator");

const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  Post.find()
    .then((posts) => {
      res.status(200).json({
        message: "All existing posts fetched successfully!",
        posts: posts,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

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

  // Setup the model used to create a post
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl, // now to replace the dummy data with actual file upload
    creator: {
      name: "Mike Ramos",
    },
  });

  // steps to officially create new post in db
  post
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Post created successfully!",
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
  const imageUrl = req.file.path.replace("\\", "/");
};
