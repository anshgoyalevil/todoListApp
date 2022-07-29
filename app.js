const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");
const dotenv = require('dotenv').config();
const servKey = process.env.servKey;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://" + servKey +".mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String,
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const itemOne = new Item({
  name: "Welcome to the TodoList ",
});

const itemTwo = new Item({
  name: "<-- Click this box to delete this item",
});

const itemThree = new Item({
  name: "Click + Button to add another item",
});

const defaultItems = [itemOne, itemTwo, itemThree];



app.get("/", function (req, res) {

  Item.find({}, function (err, foundItems) {

    if (foundItems.length === 0) {
      Item.create(defaultItems, function (err) {
        if (err) {
          console.log(err);
        }
        else {
          console.log("The items have been successfully added to the collection.");
        }
      });
      res.redirect("/");
    }
    else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }

  });

});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItemDoc = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    newItemDoc.save();
    res.redirect("/");
  }
  else {
    List.findOne({ name: listName }, function (err, results) {
      results.items.push(newItemDoc);
      results.save();
      res.redirect("/" + listName);
    });
  }


});

app.post("/delete", function (req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Item removed successfully!");
        res.redirect("/");
      }
    });
  }
  else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function (err, results) { 
      if(!err){
        res.redirect("/" + listName);
      }
     });
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, results) {
    if (!err) {
      if (!results) {
        //Create a New List
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else {
        //Show an existing list
        res.render("list", { listTitle: results.name, newListItems: results.items });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port, function () {
  console.log("Server has started successfully");
});
