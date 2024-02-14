exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: "1",
        title: "This is the first official post.",
        content: "First official content of 1st post.",
        imageUrl: "images/Mystic_Mountain.jpg",
        creator: {
          name: "Mike Ramos",
        },
        createdAt: new Date(),
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
