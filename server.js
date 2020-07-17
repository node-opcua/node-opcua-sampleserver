"use strict";
const {
    OPCUAServer,
    Variant,
    DataType,
    nodesets,
    StatusCodes,
    VariantArrayType,
    ServerEngine
} = require("node-opcua");
const os = require("os");


/**
 * @param server {OPCUAServer} server
 */
function constructAddressSpace(server) {

    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    // we create a new folder under RootFolder
    const myDevice = namespace.addFolder("ObjectsFolder", {
        browseName: "MyDevice"
    });

    // now let's add first variable in folder
    // the addVariableInFolder
    const variable1 = 10.0;

    server.nodeVariable1 = namespace.addVariable({
        componentOf: myDevice,
        nodeId: "s=Temperature",
        browseName: "Temperature",
        dataType: "Double",
        value: {
            get: () => {
                const t = new Date() / 10000.0;
                const value = variable1 + 10.0 * Math.sin(t);
                return new Variant({ dataType: DataType.Double, value: value });
            }
        }
    });

    const nodeVariable2 = namespace.addVariable({
        componentOf: myDevice,
        browseName: "MyVariable2",
        dataType: "String",
    });
    nodeVariable2.setValueFromSource({
        dataType: DataType.String,
        value: "Learn Node-OPCUA ! Read https://leanpub.com/node-opcuabyexample"
    });

    const nodeVariable3 = namespace.addVariable({
        componentOf: myDevice,
        browseName: "MyVariable3",
        dataType: "Double",
        arrayDimensions: [3],
        accessLevel: "CurrentRead | CurrentWrite",
        userAccessLevel: "CurrentRead | CurrentWrite",
        valueRank: 1

    });
    nodeVariable3.setValueFromSource({
        dataType: DataType.Double,
        arrayType: VariantArrayType.Array,
        value: [1.0, 2.0, 3.0]
    });


    const nodeVariable4 = namespace.addVariable({
        componentOf: myDevice,
        nodeId: "b=1020ffab",
        browseName: "Percentage Memory Used",
        dataType: "Double",
        minimumSamplingInterval: 1000,
        value: {
            get: () => {
                // const value = process.memoryUsage().heapUsed / 1000000;
                const percentageMemUsed = 1.0 - (os.freemem() / os.totalmem());
                const value = percentageMemUsed * 100;
                return new Variant({ dataType: DataType.Double, value: value });
            }
        }
    });

    // please 
}

(async () => {

    try {
        // Let create an instance of OPCUAServer
        const server = new OPCUAServer({
            port: 26543,        // the port of the listening socket of the server

            nodeset_filename: [
                nodesets.standard,
                nodesets.di
            ],
            buidIfo: {
                productName: "Sample NodeOPCUA Server1",

                buildNumber: "7658",
                buildDate: new Date(2020, 6, 14)
            }
        });

        await server.initialize();

        constructAddressSpace(server);

        // we can now start the server
        await server.start();

        console.log("Server is now listening ... ( press CTRL+C to stop) ");
        server.endpoints[0].endpointDescriptions().forEach(function(endpoint) {
            console.log(endpoint.endpointUrl, endpoint.securityMode.toString(), endpoint.securityPolicyUri.toString());
        });


        process.on("SIGINT", async () => {
            await server.shutdown();
            console.log("terminated");

        });
    } catch (err) {
        console.log(err);
        process.exit(-1);
    }
})();