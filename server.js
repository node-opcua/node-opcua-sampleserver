var opcua = require("node-opcua");
var os = require("os");



// Let create an instance of OPCUAServer
var server = new opcua.OPCUAServer({
    port: 1234,        // the port of the listening socket of the server
    nodeset_filename: opcua.standard_nodeset_file
});

// we can set the buildInfo
server.buildInfo.productName = "MySampleServer1";
server.buildInfo.buildNumber = "7658";
server.buildInfo.buildDate = new Date(2015, 12, 25);


// the server needs to be initialized first. During initialisation,
// the server will construct its default namespace.
server.initialize(function () {

    console.log("initialized");

    // we can now extend the default name space with our variables
    construct_my_address_space(server);

    // we can now start the server
    server.start(function () {
        console.log("Server is now listening ... ( press CTRL+C to stop)");
        var endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
        server.endpoints[0].endpointDescriptions().forEach(function (endpoint) {
            console.log(endpoint.endpointUrl, endpoint.securityMode.toString(), endpoint.securityPolicyUri.toString());
        });
    })

});


function construct_my_address_space(server) {

    var addressSpace = server.engine.addressSpace;

    // we create a new folder under RootFolder
    var myDevice = addressSpace.addFolder("ObjectsFolder", {browseName: "MyDevice"});

    // now let's add first variable in folder
    // the addVariableInFolder
    var variable1 = 10.0;


    server.nodeVariable1 = addressSpace.addVariable({
        componentOf: myDevice,
        nodeId: "ns=4;b=1020ffaa", // some opaque NodeId in namespace 4
        browseName: "MyVariable1",
        dataType: "Double",
        value: {
            get: function () {
                var t = new Date() / 10000.0;
                var value = variable1 + 10.0 * Math.sin(t);
                return new opcua.Variant({dataType: opcua.DataType.Double, value: value});
            }
        }
    });

    ///
    var variable2 = 10.0;

    server.nodeVariable2 = addressSpace.addVariable({
        componentOf: myDevice,
        browseName: "MyVariable2",
        dataType: "Double",
        value: {
            get: function () {
                return new opcua.Variant({dataType: opcua.DataType.Double, value: variable2});
            },
            set: function (variant) {
                variable2 = parseFloat(variant.value);
                return opcua.StatusCodes.Good;
            }
        }
    });


    server.nodeVariable3 = addressSpace.addVariable({
        componentOf: myDevice,
        nodeId: "ns=4;b=1020ffab", // some opaque NodeId in namespace 4
        browseName: "Percentage Memory Used",
        dataType: "Double",
        minimumSamplingInterval: 1000,
        value: {
            get: function () {
                // var value = process.memoryUsage().heapUsed / 1000000;
                var percentageMemUsed = 1.0 - (os.freemem() / os.totalmem() );
                var value = percentageMemUsed * 100;
                return new opcua.Variant({dataType: opcua.DataType.Double, value: value});
            }
        }
    });

}
