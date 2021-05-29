const express = require('express');
const bodyParser = require('body-parser');
const mongoose  = require('mongoose');
const date = require(__dirname + '/date.js');
const _ = require('lodash');

const app = express();
const url ="mongodb+srv://lee:0Ovdz5TQaTugcyQi@cluster0.ur3yo.mongodb.net/todolist?retryWrites=true";

const workItems = [];
app.set('view engine', 'ejs');
mongoose.set('useFindAndModify', false);

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

mongoose.connect(url, { useNewUrlParser: true,  useUnifiedTopology: true });

const itemsSchema = {
    name: String
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
    name: "Wolcome to your todolist!"
});
const item2 = new Item ({
    name: "Hit the + button to add a new item"
});
const item3 = new Item ({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];
const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);


// List.deleteMany({name:"Today"}, function(err){
//     if (err){
//         console.log(err);
//     }else{
//         console.log('success');
//     };
// });

app.get('/', function(req, res) {
    Item.find({}, function(err, foundItems){
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                }else{
                    console.log("Successfully saved default items to DB")
                };
            });
            res.redirect('/');
        }else{
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems,
            });
        };
    });
});

app.get('/:customListName', function(req, res){
    const customListName = _.capitalize(req.params.customListName);
    
    List.findOne({name:customListName}, function(err, foundList){
        if (!err){
            if (!foundList){
                //create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect('/'+customListName);
            }else{
                //show an existing list
                res.render("list", {listTitle:foundList.name, newListItems:foundList.items});
            };
        };
    });
});

app.get('/work', function(req, res) {
    res.render('list', {listTitle:'Work List', newListItems:workItems});
})

app.get('/about', function(req, res) {
    res.render('about')
})

app.post('/work', function(req, res) {
    let item = req.body.newItem;
    workItems.push(item);
    res.redirect('/work')
})

app.post('/', function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today"){
        item.save();
        res.redirect('/');
    }else{
        List.findOne({name: listName} , function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect('/'+listName);
        });
    };
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === 'Today') {
        Item.findByIdAndDelete(checkedItemId, function(err){
            if (!err) {
                console.log('Successfully deleted checked item');
                res.redirect('/');
            };
        });
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if (!err){
                res.redirect('/'+listName);
            };
        });
    };
});


app.listen(3000, function(){
    console.log('server startedd on port 30000')
});
