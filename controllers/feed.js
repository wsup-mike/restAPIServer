const { validationResult } = require("express-validator");

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
  Post
    .find()
    .then(posts => {
      res.status(200).json({
        message: 'All existing posts fetched successfully!',
        posts: posts,
      });
    })
    .catch(err => {
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
    
    const error = new Error('Data validation error! Entered data does NOT meet the requirements!')
    
    error.statusCode = 422;
   
    throw error;
    
    // return res
    //   .status(422)
    //   .json({
    //     message:
    //       "Data validation error! Entered data does NOT meet the requirements!",
    //     errors: errors.array(),
    //   });
  }

  // extract info from req body
  const title = req.body.title;
  const content = req.body.content;

  // Setup the model used to create a post
  const post = new Post({
    title: title,
    content: content,
    imageUrl: '/images/Mystic_Mountain.jpg',
    creator: {
      name: "Mike Ramos",
    },
  });
  
  // steps to officially create new post in db
  post 
    .save()
    .then(result => {
      console.log(result);
      res.status(201).json({
        message: "Post created successfully!",
        post: result,
      })
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
  Post
    .findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post!');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        message: 'Post fetched.',
        post: post,
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}