exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        title: "This is the first official post.",
        content: "First official content of 1st post.",
      },
    ],
  });
};

exports.createPost = (req, res, next) => {
  // extract info from req body
  const title = req.body.title;
  const content = req.body.content;

  // create new post in db
  res.status(201).json({
    message: "Post created successfully!",
    post: {
      id: new Date().toISOString(),
      title: title,
      content: content,
    },
  });
};
