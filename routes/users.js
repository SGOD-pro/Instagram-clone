const mongoose=require('mongoose')
mongoose.connect("mongodb://127.0.0.1:27017/instagram")
const plm=require('passport-local-mongoose');
const { none } = require('./multer');
const userSchema=mongoose.Schema({
  username:{
    type:String,
    require:true,
  },
  fullname:{
    type:String,
    require:true,
  },
  email:{
    type:String,
    unique:true,
    require:true,
  },
  profilePicture:{
    type:String,
    default:'default.jpg'
  },
  bio:{
    type:String,
  },
  posts:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'post'
  }],
  followers:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'user',
  }],
  following:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'user'
  }],
})
userSchema.plugin(plm);
module.exports = mongoose.model('user',userSchema);
