import os from 'os';
import {
  OPCUAServer,
  Variant,
  DataType,
  nodesets,
  VariantArrayType,
  MessageSecurityMode,
  SecurityPolicy
} from 'node-opcua';

/**
 * @param {IAddressSpace} addressSpace
 */
function constructAddressSpace (addressSpace) {
  const namespace = addressSpace.getOwnNamespace();

  // we create a new folder under RootFolder
  const myDevice = namespace.addFolder('ObjectsFolder', {
    browseName: 'MyDevice'
  });

  // now let's add first variable in folder
  // the addVariableInFolder
  const variable1 = 10.0;

  namespace.addVariable({
    componentOf: myDevice,
    nodeId: 's=Temperature',
    browseName: 'Temperature',
    dataType: 'Double',
    minimumSamplingInterval: 500,
    accessLevel: 'CurrentRead',
    value: {
      get: () => {
        const t = new Date() / 10000.0;
        const value = variable1 + 10.0 * Math.sin(t);
        return new Variant({ dataType: DataType.Double, value });
      }
    }
  });

  const uaVariable2 = namespace.addVariable({
    componentOf: myDevice,
    browseName: 'MyVariable2',
    dataType: 'String'
  });
  uaVariable2.setValueFromSource({
    dataType: DataType.String,
    value: 'Learn Node-OPCUA ! Read https://leanpub.com/node-opcuabyexample-edition2024'
  });

  const uaVariable3 = namespace.addVariable({
    componentOf: myDevice,
    browseName: 'MyVariable3',
    dataType: 'Double',
    arrayDimensions: [3],
    accessLevel: 'CurrentRead | CurrentWrite',
    userAccessLevel: 'CurrentRead | CurrentWrite',
    valueRank: 1

  });
  uaVariable3.setValueFromSource({
    dataType: DataType.Double,
    arrayType: VariantArrayType.Array,
    value: [1.0, 2.0, 3.0]
  });

  namespace.addVariable({
    componentOf: myDevice,
    nodeId: 'b=1020ffab',
    browseName: 'Percentage Memory Used',
    dataType: 'Double',
    minimumSamplingInterval: 1000,
    value: {
      get: () => {
        // const value = process.memoryUsage().heapUsed / 1000000;
        const percentageMemUsed = 1.0 - (os.freemem() / os.totalmem());
        const value = percentageMemUsed * 100;
        return new Variant({ dataType: DataType.Double, value });
      }
    }
  });
}

(async () => {
  try {
    // Let create an instance of OPCUAServer
    const server = new OPCUAServer({
      port: 26543, // the port of the listening socket of the server

      nodeset_filename: [
        nodesets.standard,
        nodesets.di
      ],
      buildInfo: {
        productName: 'Sample NodeOPCUA Server1',

        buildNumber: '7658',
        buildDate: new Date(2024, 1, 26)
      },
      securityPolicies: [SecurityPolicy.None, SecurityPolicy.Basic256Sha256 ],
    });

  
    await server.initialize();
   

    constructAddressSpace(server.engine.addressSpace);

    // we can now start the server
    await server.start();

    console.log('Server is now listening ... ( press CTRL+C to stop) ');

    
    server.endpoints[0].endpointDescriptions().forEach((endpoint) => {
      console.log(endpoint.endpointUrl, MessageSecurityMode[endpoint.securityMode], endpoint.securityPolicyUri.toString().padEnd(60));
      console.log("    ", endpoint.userIdentityTokens.map((x) => x.policyId.toString()).join(' '));
    });

    await new Promise((resolve) => process.once('SIGINT', resolve));

    await server.shutdown();
    console.log('server shutdown completed !');
  } catch (err) {
    console.log(err.message);
    process.exit(-1);
  }
})();
