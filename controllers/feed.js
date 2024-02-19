const fs = require('fs');
const path = require('path');

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

  if (!imageUrl) { // a validation
    const error = new Error("No image file chosen.");
    error.statusCode = 422;
    throw error;
  }
  
  // Now to update the database using the Post model and Mongoose' findById()
  Post
    .findById(postId)
    .then(post => { 
      if (!post) { // First check if a existing post found
        const error = new Error('Cant find the existing post');
        error.statusCode = 500;
        throw error;
      }
      // ..if post is found in database
      // 1st check imageUrl of the prior existing post (To use new helper)
      if (imageUrl !== post.imageUrl) { // meaning it changed...
        clearImage(post.imageUrl);
      }
      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then(result => {
      res.status(200).json({
        message: 'Post updated!',
        post: result
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = ((req, res, next) => {
  const postId = req.params.postId;
  Post
    .findById(postId)
    .then(post => {
      // 1st check if post exists in database
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 400;
        throw error;
      }
      // Verify identity of logged in user 
      
      // Clear out the post's image stored
      clearImage(post.imageUrl);

      // To formally delete post from database
      return Post.findByIdAndDelete(postId);

    })
    .then(result => {
      console.log(result);
      res.status(200).json({
        message: 'Post has sucessfully been deleted!'
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });


});


const clearImage = (filePath) => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
}

