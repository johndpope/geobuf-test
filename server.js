var port = 8181;

var express = require('express');
var http = require('http');

var geobuf = require('geobuf');
var Pbf = require('pbf');

var app = express(); 
var server = http.createServer(app);

var geojson = {"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[15,59.519541],[15.000173,59.519463],[15.000568,59.519205],[15.000731,59.519053],[15.000806,59.518856],[15.001023,59.518642],[15.001261,59.518276],[15.001603,59.518035],[15.001728,59.517982],[15.001837,59.51783],[15.002021,59.517526],[15.002096,59.517365],[15.002347,59.517196],[15.002393,59.516739],[15.00251,59.516281],[15.002696,59.515879],[15.002699,59.515771],[15.002773,59.515637],[15.003077,59.51545],[15.003028,59.515297],[15.003278,59.515191],[15.003495,59.514977],[15.003655,59.514915],[15.003849,59.514961],[15.004131,59.514963],[15.004497,59.515198],[15.004759,59.515299],[15.004863,59.515371],[15.005039,59.515435],[15.005142,59.515526],[15.005114,59.515735],[15.005452,59.515241],[15.005531,59.515094],[15.005582,59.514966],[15.005682,59.514909],[15.005699,59.514883],[15.005724,59.514847],[15.00548,59.514684],[15.00531,59.514413],[15.005066,59.514259],[15.004838,59.514204],[15.004714,59.514212],[15.00459,59.514239],[15.004357,59.51439],[15.004092,59.514379],[15.003935,59.514315],[15.003815,59.514153],[15.003464,59.514052],[15.003503,59.513909],[15.003804,59.513866],[15.003807,59.513722],[15.003656,59.513407],[15.003443,59.513442],[15.00325,59.513413],[15.003251,59.513351],[15.00336,59.513226],[15.003363,59.513091],[15.002875,59.512819],[15.00242,59.512636],[15.002283,59.512456],[15.002323,59.512286],[15.002578,59.511946],[15.00258,59.511874],[15.002652,59.511821],[15.002726,59.51166],[15.002731,59.511444],[15.002599,59.511049],[15.002462,59.510877],[15.002357,59.510823],[15.002146,59.510785],[15.001989,59.510713],[15.001835,59.510514],[15.001713,59.510442],[15.001381,59.510278],[15.001063,59.510294],[15.000958,59.510266],[15.000783,59.510167],[15.000112,59.510162],[15,59.510133],[14.999902,59.510107],[14.999692,59.509998],[14.999233,59.509995],[14.999058,59.509959],[14.998901,59.509859],[14.998677,59.509633],[14.998717,59.509436],[14.998525,59.509318],[14.998333,59.509254],[14.998139,59.509244],[14.997873,59.509269],[14.997411,59.509374],[14.99702,59.509497],[14.996701,59.509549],[14.996525,59.50953],[14.996437,59.509485],[14.996352,59.509376],[14.996229,59.509322],[14.996068,59.509437],[14.995765,59.509534],[14.995674,59.50965],[14.995531,59.509703],[14.995109,59.509629],[14.994792,59.509591],[14.994311,59.509794],[14.993922,59.509783],[14.993656,59.509835],[14.993477,59.509924],[14.993368,59.510058],[14.993327,59.510309],[14.99336,59.510417],[14.99374,59.510751],[14.994192,59.511042],[14.995099,59.511514],[14.995415,59.511624],[14.995645,59.511598],[14.996108,59.51143],[14.996341,59.511306],[14.996679,59.511201],[14.997016,59.511131],[14.997192,59.51115],[14.997296,59.51124],[14.997293,59.511357],[14.997361,59.511483],[14.997351,59.511914],[14.997384,59.511995],[14.997592,59.51214],[14.997554,59.512292],[14.997373,59.512471],[14.99717,59.51281],[14.997218,59.513026],[14.997287,59.513116],[14.997281,59.513332],[14.996992,59.513617],[14.997057,59.513851],[14.997019,59.51395],[14.996911,59.51403],[14.997043,59.514443],[14.997001,59.514694],[14.997033,59.514856],[14.996886,59.515071],[14.996848,59.515196],[14.996881,59.515304],[14.99677,59.515519],[14.996691,59.515842],[14.996684,59.516129],[14.996781,59.516542],[14.996628,59.517026],[14.99664,59.517233],[14.996621,59.517286],[14.996459,59.51742],[14.996473,59.517591],[14.996238,59.517796],[14.996161,59.518065],[14.996016,59.518234],[14.995977,59.518387],[14.995886,59.518476],[14.995689,59.518582],[14.995579,59.51877],[14.995418,59.51885],[14.995082,59.518866],[14.99478,59.518918],[14.993675,59.519342],[14.993337,59.519411],[14.993091,59.519392],[14.992845,59.51931],[14.992671,59.519201],[14.992639,59.519057],[14.992467,59.518858],[14.992509,59.518616],[14.992478,59.51841],[14.992375,59.518301],[14.992166,59.518183],[14.991654,59.518162],[14.991387,59.518241],[14.991018,59.518158],[14.990663,59.518246],[14.990451,59.518244],[14.990277,59.518136],[14.99037,59.51793],[14.990317,59.51792],[14.990264,59.517911],[14.99014,59.517937],[14.989782,59.518142],[14.989637,59.518302],[14.98939,59.518274],[14.989391,59.518256],[14.989392,59.518184],[14.989465,59.518095],[14.989716,59.517935],[14.989719,59.517827],[14.989721,59.517755],[14.989652,59.517665],[14.989673,59.517522],[14.98963,59.5174],[14.989557,59.517198],[14.989494,59.517106],[14.98933,59.517098],[14.989135,59.517108],[14.989324,59.51734],[14.989352,59.517663],[14.989153,59.517626],[14.989151,59.517625],[14.989106,59.517617],[14.988744,59.517237],[14.988716,59.517147],[14.98849,59.517181],[14.988183,59.517262],[14.988177,59.517288],[14.988431,59.517747],[14.988534,59.517864],[14.988534,59.5179],[14.988533,59.517936],[14.988443,59.518008],[14.988263,59.518029],[14.98823,59.518033],[14.988001,59.517996],[14.98793,59.518],[14.98786,59.518004],[14.987735,59.518057],[14.987572,59.5182],[14.987387,59.518549],[14.987365,59.518755],[14.987443,59.519177],[14.987405,59.519276],[14.987297,59.519356],[14.987217,59.519723],[14.986931,59.519883],[14.986926,59.520063],[14.986995,59.520135],[14.986993,59.520234],[14.98688,59.520502],[14.986795,59.521121],[14.986723,59.521175],[14.986792,59.521229],[14.98682,59.521552],[14.98692,59.521768],[14.986918,59.521867],[14.987056,59.521994],[14.987431,59.522552],[14.987532,59.522795],[14.987704,59.522976],[14.987735,59.523165],[14.987903,59.523498],[14.988283,59.52385],[14.988313,59.524084],[14.988273,59.524263],[14.988376,59.524408],[14.988475,59.524677],[14.988749,59.525038],[14.988815,59.525254],[14.989086,59.525723],[14.989451,59.525994],[14.989765,59.52614],[14.990357,59.526502],[14.990637,59.52663],[14.990827,59.526793],[14.990894,59.526946],[14.991121,59.527082],[14.991348,59.527164],[14.991555,59.527381],[14.992043,59.527662],[14.992197,59.527887],[14.992224,59.528211],[14.992324,59.528499],[14.992409,59.528634],[14.992581,59.528796],[14.992808,59.528941],[14.99307,59.529051],[14.993316,59.529106],[14.993651,59.529153],[14.994092,59.529165],[14.99452,59.528997],[14.995147,59.528669],[14.995393,59.528724],[14.995707,59.52887],[14.995901,59.528907],[14.996078,59.52889],[14.996363,59.528802],[14.996767,59.528912],[14.99696,59.528949],[14.997368,59.528907],[14.997954,59.528767],[14.998095,59.528786],[14.998185,59.528741],[14.998397,59.528743],[14.998664,59.528655],[14.999237,59.528344],[14.999561,59.528077],[14.999743,59.527862],[14.999868,59.5278],[15,59.527765],[15.000099,59.527739],[15.000439,59.52757],[15.000727,59.527357],[15.000713,59.527186],[15.000576,59.527006],[15.000476,59.526781],[15.000457,59.526071],[15.000302,59.5259],[15,59.525729],[14.999901,59.525673],[14.999728,59.525519],[14.999387,59.525014],[14.999289,59.524673],[14.999021,59.524079],[14.998957,59.523773],[14.998905,59.522992],[14.998793,59.522506],[14.998868,59.5216],[14.999019,59.521188],[14.999061,59.520919],[14.99917,59.520794],[14.999245,59.520615],[14.999436,59.520015],[14.999977,59.519551],[15,59.519541]]]}};

app.use(express.static('public'));

app.get('/data', function(req, res) {
  res.send(geobuf.encode(geojson, new Pbf()));
});

app.listen(port);
