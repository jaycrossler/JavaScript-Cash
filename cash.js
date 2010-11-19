//Cash.JS v.2 - not quite finished, uses async transactions

var Cash = { //object to save images into HTML5 DB
	//Note, the biggest issue with dealing with an HTML5 Database is that all calls are asynchronous
	db: 0, //database id
	imageList: [], //list of currently cached images
	loadToImg: function(src, img, makecanvas) { // load src into img from cache if exists 
	    if (Cash.db) {
	    	//Select from dDB
			Cash.db.readTransaction(function (transaction) {
				transaction.executeSql('SELECT data FROM cache_images WHERE src = ?', [src], function (transaction, r) {
					//If Exists
					if (r.rows && r.rows.length > 0) {
						//get photodata, write to img.src
						img.src = r.rows.item(0)['data'];
						console.log('Loaded from cache: ' + src);
					}else{
					//If not found, set img.src = url
						if (makecanvas) {
						//store as a canvas, then enter into cache
							img.onload = function() {
								var canvas = document.createElement('canvas');
								canvas.width = img.width;
								canvas.height = img.height;
								canvas.getContext("2d").drawImage(img, 0, 0);
								Cash.saveData(src, canvas.toDataURL());
								
								img = null; //TODO: Check this removes from memory
								canvas = null;
							}
						}
						img.src = src;
					}
				}, function (transaction, e) {
				  // couldn't read database
				  span.textContent = '(db err: ' + e.message + ')';
				  console.log('(db err: ' + e.message + ')');

				});
			});
		}
	},
	saveData: function(src, data) { // save to cache
	    if (Cash.db) {
			Cash.db.transaction(
				function (transaction) {
					transaction.executeSql("INSERT INTO cache_images (src, data) VALUES (?, ?)", [src, data] );
					console.log('Saved to cache: ' + src + ' : ' + data.length);
//TODO: Don't save if starts with "data", don't save if exists
				}
			);
		}
	},
	saveImage: function(src, img) { // save to cache
	    if (Cash.db) {
	    //	if (!src.substring(0,5) == "data:,") {
				var canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;
				canvas.getContext("2d").drawImage(img, 0, 0);
				Cash.saveData(src, canvas.toDataURL());
		//	}
		}
	},
	createList: function(runWhenDone) {//create a list of cached images
	    if (Cash.db) {
		  Cash.db.transaction(
		  	function (transaction) {
			  transaction.executeSql('SELECT src FROM cache_images', [], 
				function (transaction, results) { //Function to run when successful
				  if (results.rows && results.rows.item(0)) {  //NOTE: Use .item(0), not [0] when accessing array
					  for (var i=0;i<results.rows.length;i++) {
					  	Cash.imageList.push(results.rows.item(i)['src']);
					  }
				  	  runWhenDone();
				  } else {
					  console.log('Database Error');
				  }
				},
				function (t, e) { //Funciton to run when error
				  // couldn't read database
					console.log('Database Error: ' + e.message);
				}
			  );
			}
		  );
		}
	},
	list: function(span) { //update span with # count
	    if (Cash.db) {
		  Cash.db.transaction(
		  	function (transaction) {
				transaction.executeSql('SELECT COUNT(*) AS c FROM cache_images', [], 
				function (transaction, results) {
				//Function to run when successful
				  if (results.rows && results.rows.item(0)) {  //NOTE: Use .item(0), not [0] when accessing array
					  span.textContent = results.rows.item(0)['c'];
					  console.log('Cache holds: ' + results.rows.item(0)['c'] + ' items');

				  } else {
					  span.textContent = '(db error)';
					  console.log('Database Error');
				  }
				},
				function (t, e) {
				//Funciton to run when error
				  // couldn't read database
					span.textContent = '(db err: ' + e.message + ')';
					console.log('Database Error: ' + e.message);
			});
		  });
		}
	},
	prepare: function(ready, error) { //TODO: What does Ready do?
	    if (!window.openDatabase) {
	        Message.newMessage('HTML5 DBs not supported in this browser');
	    } else {
		  Cash.db = openDatabase('cache_imgs', '1.0', 'Offline image storage', 5*1024*1024);

		  Cash.db.transaction(
		  	function(t) {
			  t.executeSql('CREATE TABLE cache_images (src, data)', []);  //TODO: Also store metadata?, catch errors
		  });
		console.log("DB and Tables created");
		}
	},
	deleteAll: function() { // delete all images
	    if (Cash.db) {
		  Cash.db.transaction(
		  	function (transaction) {
				transaction.executeSql('DELETE FROM cache_images', [], [], []);
			}
		  )
		 }
	},

	drawImageOnCanvas: function(data, canvas, runwhendone) {
	    var img = new Image();
	    img.onload = function() {
	        canvas.width = img.width;
	        canvas.height = img.height;
	        canvas.getContext("2d").drawImage(img, 0, 0);
	        img = null; //TODO: Check this removes from memory
	        //exec(runwhendone); //TODO ??
	    };
	    img.src = data;
	},
	serializeCanvasByID:function(canvas) {
		var serializedVal = 'data:,';
		if (canvas.toDataURL) serializedVal = canvas.toDataURL();
	    return serializedVal;
	},
	init: function(){
		Cash.prepare();
		Cash.createList(function() {Game.initGame();});
		//TODO: If prepared is done, should it set a ready variable?
	},
	test: function(){
		Cash.deleteAll();
	}

}
Cash.init();