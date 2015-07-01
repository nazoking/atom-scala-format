var path = require('path');

function findJavaPath(){
  var java_home = process.env["JAVA_HOME"];
  if(java_home){
    return path.join(java_home, "bin", "java");
  }else{
    return "java";
  }
}

/*
 * This file is the entry point of your package. It will be loaded once as a
 * singleton.
 *
 * For more information: https://atom.io/docs/latest/creating-a-package#source-code
 */
module.exports = {

  /*
   * This required method is called when your package is activated. It is passed
   * the state data from the last time the window was serialized if your module
   * implements the serialize() method. Use this to do initialization work when
   * your package is started (like setting up DOM elements or binding events).
   */
  activate: function() {
    return atom.commands.add('atom-workspace', 'scala-format:format', this.format);
  },

  /*
   * This optional method is called when the window is shutting down, allowing
   * you to return JSON to represent the state of your component. When the
   * window is later restored, the data you returned is passed to your module's
   * activate method so you can restore your view to where the user left off.
   */
  serialize: function() {
    return console.log('serialize()');
  },

  /*
   * This optional method is called when the window is shutting down. If your
   * package is watching any files or holding external resources in any other
   * way, release them here. If you're just subscribing to things on window, you
   * don't need to worry because that's getting torn down anyway.
   */
  deactivate: function() {
    return console.log('deactivate()');
  },

  /*
   * This method formats the active file using scalariform
   *
   */
  format: function() {
    console.log("format()");
    var editor = atom.workspace.getActiveTextEditor();
    if(!editor){
      console.log('Not a editor. Doing nothing');
      return;
    }

    var spawn = require('child_process').spawn;

    var java = atom.config.get("scala-format.javaPath");
    if(java){
      if(typeof(java)!='string'){
        throw Error("scala-format.javaPath is not string('"+typeof(java)+"')");
      }
    }else{
      java = findJavaPath();
    }
    var args = ['-Dfile.encoding=UTF-8'];

    var javaOptions = atom.config.get("scala-format.javaOptions");
    if(javaOptions){
      if(typeof(javaOptions)=='string'){
        javaOptions = [javaOptions];
      }
      args = javaOptions;
    }

    var jarPath = atom.config.get("scala-format.jarPath");
    if(!jarPath){
      jarPath = path.join(atom.packages.getLoadedPackage('scala-format').path, 'bundle','scalariform.jar');
    }
    args = args.concat(['-jar', jarPath]);

    var preferenceFile = atom.config.get("scala-format.preferenceFile");
    if(preferenceFile){
      args.push('--preferenceFile='+preferenceFile);
    }
    args.push('--encoding='+editor.getEncoding());

    var scarariformOptions = atom.config.get("scala-format.scarariformOptions");
    if(scarariformOptions){
      args = args.concat(scarariformOptions);
    }

    args.push('--stdin');
    args.push('--stdout');

    console.log(java, args);
    var child = spawn(java, args);
    var out = "";
    child.stdout.on('data',function(data){
      out += data.toString();
    });
    child.stderr.on('data',function(data){
      console.log('stderr: ', data);
      throw Error("scala-foramt error "+data.toString());
    });
    child.on('exit',function(code){
      console.log('exit: ', code);
      if(code === 0){
        editor.setText(out);
      }else{
        throw new Error("scala-foramt execute fail: "+ [java].concat(args).join(' '));
      }
    });
    child.stdin.write(editor.getText());
    child.stdin.end();
  },
  config:{
    javaPath: {
      title: "java path",
      default:findJavaPath(),
      type: 'string'
    },
    javaOptions: {
      "title": 'Java Options',
      "default": ['-Dfile.encoding=UTF-8'],
      type: 'array',
      items: {
        type: 'string'
      }
    },
    jarPath: {
      title: "scarariform.jar path",
      default:path.join(path.join.apply(path,atom.packages.getPackageDirPaths()), 'scala-format', 'bundle','scalariform.jar'),
      type: 'string'
    },
    preferenceFile: {
      "title": 'scalariform preference file path',
      default:"",
      type: 'string'
    },
    scarariformOptions: {
      "title": 'scarariform Options',
      "default": [],
      type: 'array',
      items: {
        type: 'string'
      }
    },
  }
};
