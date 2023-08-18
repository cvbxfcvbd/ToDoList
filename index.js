//jshint esversion:6
require('dotenv').config();
import _ from 'lodash';
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
const app = express();
const PORT = process.env.PORT || 3000;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log('mongodb connected');
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

mongoose.set('strictQuery', false);


app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
//Created Schema
const itemsSchema = new mongoose.Schema({
  name: String
});

//Created model
const Item = mongoose.model("Item", itemsSchema);

//Creating items
const item1 = new Item({
  name: "Welcome to your todo list."
});

const item2 = new Item({
  name: "Hit + button to create a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});


var z;

var defaultItems = [item1, item2, item3];

var customListName = "";

var defaultItems2 = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model('List', listSchema)

//Storing items into an array


//In latest version of mongoose insertMany has stopped accepting callbacks
//instead they use promises(Which Angela has not taught in this course)
//So ".then" & "catch" are part of PROMISES IN JAVASCRIPT.

//PROMISES in brief(If something is wrong please correct me):
//In JS, programmers encountered a problem called "callback hell", where syntax of callbacks were cumbersome & often lead to more problems.
//So in effort to make it easy PROMISES were invented.
//to learn more about promise visit : https://javascript.info/promise-basics
//Or https://www.youtube.com/watch?v=novBIqZh4Bk

Item.find().countDocuments()
  .then(result => {
    z = result;
    console.log("Number of documents: ", z);
    if (z === 0) {
      return Item.insertMany(defaultItems); // Return the promise chain
    } else {
      return Promise.resolve(); // No need to insert items, resolve the promise
    }
  })
  .then(insertResult => {
    if (insertResult) {
      console.log("Default items inserted:", insertResult);
    }

    // Fetch the items to display in the template
    return Item.find(); // Fetch the items here
  })
  .then(items => {
    defaultItems = items;
  })

app.get("/favicon.ico", function (req, res) {
  res.redirect("/");
});


app.get("/", function (req, res) {

  res.render("list.ejs", {
    listTitle: "Today",
    defaultItems: defaultItems
  });

});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  })

  if (listName === "Today") {
    defaultItems.push(item);

    item.save();

    res.redirect("/");
  } else {
    List.updateOne({
        name: listName
      }, {
        $push: {
          items: item
        }
      })
      .then(result => {
        console.log(result);
        return List.findOne({
          name: listName
        });
      })

      .then(result => {
        defaultItems2 = result.items;
        res.redirect("/" + listName);
      })
      .catch(err => {
        console.log(err);
        res.redirect("/" + listName);
      })
  }

});

app.post("/delete", (req, res) => {
  if (req.body.checkbox_custom) {
    const checkedItemId = req.body.checkbox_custom;
    console.log(checkedItemId);
    List.updateOne({
          "items._id": checkedItemId
        }, // Replace with the actual list _id
        {
          $pull: {
            items: {
              _id: checkedItemId
            }
          }
        }
      )
      .then(result => {
        console.log(result);
      })
      .catch(err => {
        console.log(err);
      })
    List.find()
      .then(result => {
        res.redirect("/" + customListName);
      })
      .catch(err => {
        console.log(err);
      });
  } else {
    const checkedItemId = req.body.checkbox_today;
    Item.deleteOne({
        _id: checkedItemId
      })
      .then(result => {
        console.log(result);
        return Item.find();
      })
      .then(items => {
        defaultItems = items; // Update the defaultItems
        res.redirect("/");
      })
      .catch(err => {
        console.log(err);
      });
  }


})

app.get("/:topic", (req, res) => {
  customListName = _.lowerCase(req.params.topic);;

  List.findOne({
      name: customListName
    })

    .then(result => {
      if (!result) {
        console.log("database nou");
        const list = new List({
          name: customListName,
          items: [item1, item2, item3]
        });
        defaultItems2 = [item1, item2, item3];
        return list.save();
      } else {
        defaultItems2 = result.items;
        console.log("database vechi");
      }
    })
    .catch(err => {
      console.log("Couldn't finish the operation: " + err);
    })
  res.render("list.ejs", {
    listTitle: customListName,
    defaultItems2: defaultItems2
  });
})

app.get("/about", function (req, res) {
  res.render("about");
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('Listening on port');
  })
})