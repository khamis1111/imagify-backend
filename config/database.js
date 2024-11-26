const mongoose = require("mongoose");

const database = () => mongoose.connect('mongodb+srv://advanced:advanced@cluster0.cuqk4.mongodb.net/imagify')
    .then(res => console.log(`Database Connected ${res.connection.name}`)).catch((errr) => console.log(errr))

module.exports = database