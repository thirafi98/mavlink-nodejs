var colors = require('colors');

var charm = require('charm')();
charm.pipe(process.stdout);
charm.reset();

// charm.write('\033c');

var wahana = require('./mavlink_connection.js');
var emitter = wahana.get_emitter();

/*console.log(colors.rainbow(argv.path));
*black
red
green
yellow
blue
magenta
cyan
white
gray
grey
* */
var stdin = process.openStdin();

function custom_prompt(){
    charm.write('➜  '.cyan.bold);
    if(wahana.get_mode_str() != undefined){
      charm.write(wahana.get_mode_str().magenta);
      charm.write(' '.cyan);
    }
}

var connected = false;
var mode_str = 'STABILIZE';
var arm_status = false;
var sat_num = 0;
var HDOP = 0;
var VDOP = 0;
var pitch = 0.0;
var roll = 0.0;
var yaw = 0.0;
var lat = 0.0;
var lng = 0.0;
var vx = 0.0;
var vy = 0.0;
var vz = 0.0;
var alt = 0.0;
var curwp = 0;
var bat = 0.0;
var status_his = [];

function put_status_his(text){
  status_his.push(text);
  if(status_his.length>5){
    status_his.splice(0,1);
  }
}

var refreshed = false;

function refresh_cmdline() {
  if(refreshed){
    charm.push();
  }
  charm.position(0,1);
  if(connected){
    charm.write('Connected\t'.green.bold);
  }
  else{
    charm.write('Disconnected\t'.red.bold);
  }
  charm.write(wahana.get_mode_str().magenta.bold);
  charm.write('\t'.cyan);
  if(arm_status){
    charm.write('ARM\t'.yellow.bold);
  }
  else{
    charm.write('DISARM\t'.grey.bold);
  }
  var tmp_str = 'SatNum: '+sat_num+'\t';
  charm.write(tmp_str.cyan);
  tmp_str = 'HDOP: '+HDOP+'\t';
  charm.write(tmp_str.cyan);
  tmp_str = 'VDOP: '+VDOP+'\t\t';
  charm.write(tmp_str.cyan);
  tmp_str = 'Battery: '+bat+'V\t';
  charm.write(tmp_str.cyan);

  charm.position(0,2);
  tmp_str = 'Pitch: '+pitch+'\t';
  charm.write(tmp_str.cyan);
  tmp_str = 'Roll: '+roll+'\t';
  charm.write(tmp_str.cyan);
  tmp_str = 'Yaw: '+yaw+'\t';
  charm.write(tmp_str.cyan);
  tmp_str = 'Lat: '+lat+'\t\t';
  charm.write(tmp_str.cyan);
  tmp_str = 'Lng: '+lng+'\t';
  charm.write(tmp_str.cyan);
  
  charm.position(0,3);
  tmp_str = 'X-Speed: '+vx+'m/s\t';
  charm.write(tmp_str.cyan);
  tmp_str = 'Y-Speed: '+vy+'m/s\t';
  charm.write(tmp_str.cyan);
  tmp_str = 'Z-Speed: '+vz+'m/s\t';
  charm.write(tmp_str.cyan);
  tmp_str = 'Height: '+alt+'m\t';
  charm.write(tmp_str.cyan);


  for(var i=0;i<5;i++){
    charm.position(0, 4+i);
    charm.erase('line');
    var line = '>> ';
    if(i<status_his.length){
      line += status_his[i];      
    }

    charm.write(line.yellow);
  }

  charm.position(0,9);
  charm.write('➜ nodegcs v1.0'.cyan.bold);
  charm.position(0,10);
  if(refreshed){
    charm.pop();
  }
  refreshed = true;
}

function is_tcp_connection(path){
  return path.indexOf(':') > -1;
}

function start_connection(){
  if(is_tcp_connection(port_path)){
    var ip_addr = port_path.split(':')[0];
    var ip_port = port_path.split(':')[1];
    wahana.set_connection(1, ip_addr, parseInt(ip_port));
  }
  else if(!wahana.check_serial()){
    // console.log('Build new')
    wahana.set_connection(0, port_path, 57600);
  }
  else{
    wahana.resume_serial();
  }
  wahana.set_default_stream_rates(1,1,1,1,1,1,0,0);
  wahana.set_custom_mode(6);
}

var connected = false;
// start_connection();
// custom_prompt();
refresh_cmdline();

stdin.on('data', function(d) {
  var cmd_str = d.toString().trim();
  /*console.log(colors.blue(cmd_str));*/
  var cmd_list = cmd_str.split(' ')
  switch(cmd_list[0]){
    case 'start':
      if(cmd_list.length > 1){
        wahana.set_connection(0, cmd_list[1], parseInt(cmd_list[2]));
      }
      else{
        //conn port mavproxy
        // wahana.set_connection(1, 127.0.0.1, 14550);
        wahana.set_connection(1, '127.0.0.1', 14550);
        wahana.set_default_stream_rates(1,1,1,1,1,1,0,0);
      }
    break;
    case 'stop':
      wahana.pause_serial();
    break;
    case 'setmode':
      wahana.set_custom_mode(cmd_list[1]);
    break;
    case 'banner':
      wahana.send_banner();
    break;
    case 'version':
      wahana.send_version();
    break;
    case 'arm':
      wahana.set_arming();
    break;
    case 'disarm':
      wahana.set_disarming();
    break;
    case 'misat':
      wahana.mission_request_individual(cmd_list[1]);
    break;
    case 'miscnt':
      wahana.mission_request_list();
    break;
    case 'setcur':
      wahana.mission_set_current(cmd_list[1]);
    break;
    case 'writewp':
      as.mission_write_waypoint(cmd_list[1], cmd_list[2], cmd_list[3], cmd_list[4], cmd_list[5], cmd_list[6], cmd_list[7], cmd_list[8]);
    break;
    case 'writertl':
      wahana.mission_write_rtl(cmd_list[1], cmd_list[2], cmd_list[3], cmd_list[4]);
    break;
    case 'upmis':
      wahana.init_mission_trans();
    break;
    case 'misall':
      wahana.mission_get_all();
    break;
    case 'misprint':
      wahana.mission_print();
    break;
    case 'misupalt':
      /*var fields = JSON.parse(cmd_list[1]);*/
      wahana.mission_update_alt(cmd_list[1], cmd_list[2]);
    break;
    case 'misstart':
      wahana.mission_cmd_mission_start();
    break;
    case 'takeoff':
      wahana.mission_cmd_takeoff(cmd_list[1]);
    break;
    case 'rtl':
      wahana.mission_cmd_rtl();
    break;
    // case 'parachute':
    //   wahana.mission_open_parachute();
    // break;
    case 'land':
      wahana.mission_cmd_land();
    break;
    case 'getp':
      wahana.param_request_single(cmd_list[1]);
    break;
    case 'setp':
      wahana.param_set_value(cmd_list[1], cmd_list[2], cmd_list[3]);
    break;
    case '':
      /*console.log(wahana.get_base_status());*/
    break;
    default:
      put_status_his('command not supported');
  }
  charm.position(0, 10);
  charm.erase('line');
  refresh_cmdline();
});

emitter.on('connection_regained', function(){
  put_status_his('connection regained\n'.yellow);
  connected = true;
});

emitter.on('arming', function(){
  arm_status = true;
});

emitter.on('disarming', function(){
  arm_status = false;
});

emitter.on('command_ack', function(field){
  if(field.result == 0){
    process.stdout.clearLine();  // clear current text
    process.stdout.cursorTo(0);  // move cursor to beginning of line
    put_status_his('command success'.yellow);
  }
});

emitter.on('attitude', function(field){
  pitch = field.pitch.toFixed(3);
  roll = field.roll.toFixed(3);
  yaw = field.yaw.toFixed(3);
});

emitter.on('gps_raw_int', function(field){
  hdop = field.eph;
  vdop = field.epv;
  sat_num = field.satellites_visible;
});

emitter.on('global_postion', function(field){
  lat = (field.lat/1E7).toFixed(6);
  lng = (field.lon/1E7).toFixed(6);
  alt = (field.relative_alt/1000).toFixed(2);
  vx = (field.vx/1E2).toFixed(2);
  vy = (field.vy/1E2).toFixed(2);
  vz = (field.vz/1E2).toFixed(2);
});

emitter.on('sys_status', function(field){
  bat = field.battery_voltage/1E3;
});

emitter.on('status_text', function(field){
  put_status_his(field);
  refresh_cmdline();
});

emitter.on('serial_list', function(field){
  for(var i = 0;i < field.length; i++){
    put_status_his(field[i].comName);
  }
  refresh_cmdline();
});

setInterval(refresh_cmdline, 1000);