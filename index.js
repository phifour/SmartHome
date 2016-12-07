var express = require('express');
var mongoose = require('mongoose');
var cors = require('cors');
var router = express.Router();              // get an instance of the express Router
var bodyParser = require('body-parser');
var apoc = require('apoc');
var app = express();

var dbHost = 'mongodb://localhost:27017';
mongoose.connect(dbHost);

var port = 3000;

//Create a schema for Book
var bookSchema = mongoose.Schema({
  name: String,
  //Also creating index on field isbn
  isbn: {type: String, index: true},
  author: String,
  pages: Number,
  a:String,
  b:String,
  c:[]
});

var Book = mongoose.model('Book', bookSchema, "books");
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
console.log("Connected to DB");

});


app.set('port', (process.env.PORT || port));
app.use(express.static(__dirname + '/public'));

app.use(cors({origin: 'http://localhost:'+port}));
// views is directory for all template files
// app.set('views', __dirname + '/views');
// app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
app.all('*', function(req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:'+port);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


router.get('/getBook', function(req, res) {
    //console.log(req.body);    
   Book.find({}, "a b c", function(err, result){
    if ( err ) throw err;
    //console.log("Find Operations: " + result);
     res.json(result);   
  });
});

router.get('/getTerms', function(req, res) {
    //console.log(req.body);    
   Book.find({ "c.1": { "$exists": true } }, "a b c", function(err, result){
    if ( err ) throw err;
    console.log("Find Operations: " + result);
     res.json(result);   
  });
});


//Example Person.
//   find({
//     occupation: /host/,
//     'name.last': 'Ghost',
//     age: { $gt: 17, $lt: 66 },
//     likes: { $in: ['vaporizing', 'talking'] }
//   }).
//   limit(10).
//   sort({ occupation: -1 }).
//   select({ name: 1, occupation: 1 }).
//   exec(callback);



router.get('/elementbyID/:id', function(req, res) {    
   Book.findOne({"_id": req.params.id}, function(err, result){
    if ( err ) throw err;
    console.log("ELEMENT FOUND: " + result);
     res.json(result);   
  });});



function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}



router.get('/quiz', function(req, res) {    


    var random_number = randomIntFromInterval(0,99);

    var quiz = {questions:['Was ist der hoechste Berg ?'],number:random_number};

     res.json(quiz);   
  
  
}
  );










router.post('/updateelementbyID', function(req, res){
  console.log('updateeleemnt',req.body);
  var obj = req.body;   
  var id = obj._id;

  //delete obj['thisid'];
  delete obj['$$hashKey'];
  Book.findByIdAndUpdate(id, obj , function(err, user) {
    if (err) throw err;
    res.json(user);  
    console.log("changed object",user);
    });
});

//
//  Neo4j
//

router.route('/getnodes/:type').get(function (req, res, next) {
    var body = req.body.type;
   
    var type = req.params.type;
    console.log("type",req.params.type);
    console.log("body",req.body);
    //var text = req.params.bear_id + 'hooray! welcome to our api!' + req.params.bar;     
    //var cypher_query = 'MATCH (n:'+type+') RETURN n LIMIT 25';
    var cypher_query = 'MATCH (n:' + type + ') RETURN ID(n),n.name';
    console.log(cypher_query);
    var query = apoc.query(cypher_query);
    console.log(query.statements) // array of statements in this query
    query.exec().then(function (result) {
        res.json(result);
    }, function (fail) {
        console.log(fail)
    })

});

router.post('/addnode', function (req, res, next) {
    var name = req.body.name;
    var nodetype = req.body.nodetype;
    var cypher_query = 'CREATE (n:' + nodetype + ' { name : "' + name + '" })';    
    //console.log('query',cypher_query);
    var query = apoc.query(cypher_query);    
    //console.log(query.statements); // array of statements in this query
    query.exec().then(function (result) {
        res.json(result);
    }, function (fail) {
        //console.log(fail)
    })
});


router.post('/connectnodes', function (req, res, next) {
    var id1 = req.body.id1;
    var id2 = req.body.id2;
    var relation = req.body.relation;       
    var cypher_query = 'MATCH (t),(m) WHERE ID(t) = '+id1+' AND ID(m) = '+id2+' CREATE (t)-[r:'+relation+']->(m)';
    //not working var cypher_query = 'MERGE (u:Animal {ID : '+id1+'})-[:'+relation+']-(u2:Animal {ID : '+id2+'})';    
    //console.log('query',cypher_query);
    var query = apoc.query(cypher_query);    
    //console.log(query.statements); // array of statements in this query
    query.exec().then(function (result) {
        res.json(result);
    }, function (fail) {
        //console.log(fail)
    })
});

router.get('/getshortestpath', function (req, res, next) {     
    var cypher_query = 'MATCH p=SHORTESTPATH((a{name:\'Namenlos\'})-[r:y1*..3]-(b{name:\'xyx\'})) RETURN p';
    //not working var cypher_query = 'MERGE (u:Animal {ID : '+id1+'})-[:'+relation+']-(u2:Animal {ID : '+id2+'})';    
    //console.log('query',cypher_query);
    var query = apoc.query(cypher_query);    
    //console.log(query.statements); // array of statements in this query
    query.exec().then(function (result) {
        res.json(result);
    }, function (fail) {
        //console.log(fail)
    })
});

app.use('/api', router);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


