/**
 * Description:
 *  List ec2 instances info
 *  Show detail about an instance if specified an instance id
 *  Filter ec2 instances info if specified an instance name
 *
 * Commands:
 *  hubot ec2 ls - Displays Instances
 *
 * Notes:
 *  --instance_id=***     : [optional] The id of an instance. If omit it, returns info about all instances.
 *  --instance_filter=*** : [optional] The name to be used for filtering return values by an instance name.
 */
var cmd_char = process.env.HUBOT_COMMAND_CHAR || "\!";
var base_id = "hubot-nao.nao-";
var command_name = "nao";
var robot;
var get_arg_params;

var actions = {
  say: {
    name: "",
    regexp: "(\-\-[^ ]+ )*([^\-].+)?$",
//
// Use function to allow use of this.properties
//
//    help: function() {
//      return this.name + " [options] <parent_project_name> <project_name_to_generate>";
//    },
    help: "[options] <message>",
    arg_params: "msg.match[1]",
    required_params: [
      "msg.match[2]"
    ],
    request_message: "\"Sending message to nao '\" + msg.match[2].trim() + \"'...\"",
    process: function(robot, action, msg) {
      for (var i =0; i < action.required_params.length; i++) {
        var required_param = action.required_params[i];
        
        if (!eval(required_param)) {
          msg.send(show_help(action) + "\n[options] can be :\n--output : use verbose output");
          return;
        }
      }

      msg.send(eval(action.request_message));

      var arg_params = get_arg_params(eval(action.arg_params));

      robot.emit('mqtt:pub', msg, process.env.HUBOT_NAO_PUBLISH_TOPIC, msg.match[2].trim());
    }
  }
};

function get_arg_params(arg) {
  var output_capture, output;

  output_capture = /--output( |$)/.exec(arg);
  output = output_capture ? true : false;

  return {
    output: output
  };
};


function show_help(action) {
  return "Usage : " + cmd_char + command_name + " " + action.name + " " + action.help;
}

/*
function show_help() {
  var msg = "";

  for (var key in actions) {
    if (actions.hasOwnProperty(key)) {
      var action = actions[key];
    }
  }
  return "Usage : " + cmd_char + command_name + " " + action.name + " " + action.help;
}
*/

module.exports = function(robotAdapter) {
  var regx;
  robot = robotAdapter;
  subscriptions = {};
  var help_msg = "- Nao commands -\n";
//  var negative_regx;

  for (var key in actions) {
    if (actions.hasOwnProperty(key)) {
      var action = actions[key];
      // Keep information for gobal help
      help_msg += action.name + "\n\t" + show_help(action) + "\n";
      regx = new RegExp("^@?(?:" + robot.name + "\\s+)?" + cmd_char + command_name + " " + action.name + action.regexp, "i");

      robot.hear(regx, {
        id: base_id + action.name
      }, action.process.bind(this, robot, action));

      robot.logger.info(">>> Nao command added : " + action.name);
    }
  }

  regx = new RegExp("^@?(?:" + robot.name + "\\s+)?" + cmd_char + command_name + "( \-\-.+)*$", 'i');
  robot.hear(regx, {
    id: base_id + 'help'
  }, function(msg) {
    var msg_txt = help_msg;

    msg_txt += "\n[options] can be :\n--output : use verbose output";
    msg.send(msg_txt);
  });

  robot.on('help:get', function(msg, command, action_id) {
    // a message is passed
    if (msg) {
      // there is a command specified
      if (command) {
        // command is this command name
        if (command.toUpperCase() == command_name.toUpperCase()) {
          // for each actions
          for (var key in actions) {
            if (actions.hasOwnProperty(key)) {
              // either action is not specified or is equal to current iteration key
              if (!action_id || (action_id && action_id.toUpperCase() === key.toUpperCase())) {
                // send help message
                msg.send(show_help(actions[key]) + "\n[options] can be :\n--output : use verbose output");
                // action specified
                if (action_id) {
                  // stop
                  break;
                }
              }
            }
          }
        }
      } else {
        // output full current command help
        var msg_txt = help_msg;

        msg_txt += "\n[options] can be :\n--output : use verbose output";
        msg.send(msg_txt);
      }
    }
  });
};
