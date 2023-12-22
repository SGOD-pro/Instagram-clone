var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./posts');
const passport = require('passport');
const multer = require('./multer')
const localStratagy = require('passport-local');
const fs = require('fs')
passport.use(new localStratagy(userModel.authenticate()))

router.get('/', function (req, res, next) {
  res.render('index');
});
router.get('/register', function (req, res, next) {
  res.render('register');
});
router.get('/home', isLogedIn, async function (req, res, next) {
  const posts = await postModel.find().populate('user');
  shuffleArray(posts);
  const user = await userModel.findOne({ username: req.session.passport.user })
  const pic = user.profilePicture
  res.render('home', { posts, pic, user });

});
router.get('/profile', isLogedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate('posts')
  const mainUser = user._id
  const pic = user.profilePicture
  const edit = true
  res.render('profile', { user, pic, edit, mainUser });
});
router.get('/search', isLogedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate('posts')
  const pic = user.profilePicture
  res.render('search', { user, pic });
});
router.get('/post-details/:id', isLogedIn, async function (req, res, next) {
  const post = await postModel.findOne({ _id: req.params.id })
  res.json(post)
});
router.get('/search/:username', isLogedIn, async function (req, res, next) {
  const regex = new RegExp(`^${req.params.username}`, 'i')
  const user = await userModel.find({ username: regex })
  res.json(user);
});

router.get('/followers/:id', isLogedIn, async function (req, res, next) {
  const id = req.params.id
  const loginUser = await userModel.findOne({ username: req.session.passport.user })
  const user = await userModel.findOne({ _id: id })

  if (user.followers.indexOf(loginUser._id) === -1) {
    user.followers.push(loginUser._id);
  }
  else {
    user.followers.splice(user.followers.indexOf(loginUser._id), 1)
  }
  if (loginUser.following.indexOf(id) === -1) {
    loginUser.following.push(id);
  }
  else {
    loginUser.following.splice(loginUser.following.indexOf(id), 1)
  }
  await user.save();
  await loginUser.save();
  let len = loginUser.following.length;
  res.send(`${len}`)
});
router.get('/like-dislike/:id', isLogedIn, async function (req, res, next) {
  const id = req.params.id
  const post = await postModel.findOne({ _id: id })
  const user = await userModel.findOne({ username: req.session.passport.user })
  if (post.likes.indexOf(user._id) === -1) {
    post.likes.push(user._id);
  }
  else {
    post.likes.splice(post.likes.indexOf(user._id), 1)
  }
  await post.save()
  let len = post.likes.length;
  res.send(`${len}`)
});

router.get('/searched-id/:id', isLogedIn, async function (req, res, next) {
  const mainUser = await userModel.findOne({ username: req.session.passport.user })
  const user = await userModel.findOne({ _id: req.params.id }).populate('posts')
  var edit = false
  if (mainUser._id == req.params.id) {
    edit = true;
  }
  const pic = mainUser.profilePicture
  res.render('profile', { user, pic, edit, mainUser });
});
router.get('/getFollowers', async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user });
    const followers = user.followers;
    let users = [];

    // Using Promise.all to wait for all async operations to complete
    await Promise.all(followers.map(async (element) => {
      const u = await userModel.findOne({ _id: element });
      users.push(u);
    }));

    console.log(users);
    res.json(users);
})
router.get('/getFollowing', async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const following = user.following;
  let users = [];

  // Using Promise.all to wait for all async operations to complete
  await Promise.all(following.map(async (element) => {
    const u = await userModel.findOne({ _id: element });
    users.push(u);
  }));

  console.log(users);
  res.json(users);
})
router.get('/delete-post/:id', async (req, res) => {
  const id = req.params.id;
  const post = await postModel.findOneAndDelete({ _id: id })
  console.log(post);
  const filePath = './public/uploads/' + post.post;
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
    } else {
      console.log('File deleted successfully');
    }
  });
  res.redirect('/profile');
})
router.post('/register', async (req, res) => {
  const { username, fullname, email } = req.body;
  const userData = new userModel({ username, fullname, email })
  userModel.register(userData, req.body.password).then(function () {
    passport.authenticate('local')(req, res, function () {
      res.redirect('/profile');
    })
  })
})
router.get('/like/:id', isLogedIn, async function (req, res, next) {
  const id = req.params.id
  const post = await postModel.findOne({ _id: id })
  const user = await userModel.findOne({ username: req.session.passport.user })
  if (post.likes.indexOf(user._id) === -1) {
    post.likes.push(user._id);
  }
  await post.save()
  let len = post.likes.length
  res.send(`${len}`)
});
router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/',
}), (req, res) => { })

router.post('/edit-profile', multer.single('image'), async (req, res) => {

  const user = await userModel.findOne({ username: req.session.passport.user })
  if (req.body.bio != '') {
    user.bio = req.body.bio;
  }
  if (req.file) {
    const filePath = './public/uploads/' + user.profilePicture;
    user.profilePicture = req.file.filename
    if (filePath != './public/uploads/default.jpg') {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        } else {
          console.log('File deleted successfully');
        }
      });
    }
  }
  await user.save();
  res.redirect('/profile')
})
router.post('/create-post', multer.single('image2'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("There is no file.")
  }
  const user = await userModel.findOne({ username: req.session.passport.user })
  const post = await postModel.create({
    caption: req.body.caption,
    post: req.file.filename,
    user: user._id,
  })
  console.log(user);
  user.posts.push(post._id);
  await user.save();
  res.redirect('/home')
})
router.get('/logout', (req, res, next) => {
  req.logOut(function (error) {
    if (error) {
      return next();
    }
    res.redirect('/')
  })
})

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap array[i] and array[j]
    [array[i], array[j]] = [array[j], array[i]];
  }
}
function isLogedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/')
}
module.exports = router;
