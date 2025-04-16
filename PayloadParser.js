//Test: : 010115410000005E000000020156000000FE2703

function parseUplink(device, payload) {
    var payloadb = payload.asBytes();
    var decoded = S2120Decoder({ bytes: payloadb }, payload.port);
    env.log(decoded);

    // Air Temperature
    var sensor1 = device.endpoints.byAddress("1");
    
    // Air Humidity
    var sensor2 = device.endpoints.byAddress("2");
    
    // Light Intensity
    var sensor3 = device.endpoints.byAddress("3");
    
    // UV Index
    var sensor4 = device.endpoints.byAddress("4");

    // Wind Speed
    var sensor5 = device.endpoints.byAddress("5");

    // Wind Direction Sensor
    var sensor6 = device.endpoints.byAddress("6");

    // Rain Gauge
    var sensor7 = device.endpoints.byAddress("7");

    // Barometric Pressure
    var sensor8 = device.endpoints.byAddress("8");

    // Endpoints update..

    if (sensor1 != null && decoded.AirTemperature != null)
        sensor1.updateTemperatureSensorStatus(decoded.AirTemperature);

    if (sensor2 != null && decoded.AirHumidity != null)
        sensor2.updateHumiditySensorStatus(decoded.AirHumidity);

    if (sensor3 != null && decoded.LightIntensity != null)
        sensor3.updateLightSensorStatus(decoded.LightIntensity);

    if (sensor4 != null && decoded.UvIndex != null)
    sensor4.updateGenericSensorStatus(decoded.UvIndex);

    if (sensor5 != null && decoded.WindSpeed != null)
        sensor5.updateGenericSensorStatus(decoded.WindSpeed);   
    
    if (sensor6 != null && decoded.windDirection !=null)
        sensor6.updateGenericSensorStatus(message.measurementValue);
    
    if (sensor7 != null && decoded.RainfallHourly != null)
        sensor7.updateGenericSensorStatus(decoded.RainfallHourly);
    
    if (sensor8 != null && decoded.BarometricPressure != null)
        sensor8.updatePressureSensorStatus(decoded.BarometricPressure);
}

function buildDownlink(device, endpoint, command, payload) {
    // This function allows you to convert a command from the platform 
    // into a payload to be sent to the device.
    // Learn more at https://wiki.cloud.studio/page/200

    // The parameters in this function are:
    // - device: object representing the device to which the command will
    //   be sent. 
    // - endpoint: endpoint object representing the endpoint to which the 
    //   command will be sent. May be null if the command is to be sent to 
    //   the device, and not to an individual endpoint within the device.
    // - command: object containing the command that needs to be sent. More
    //   information at https://wiki.cloud.studio/page/1195.

    // This example is written assuming a device that contains a single endpoint, 
    // of type appliance, that can be turned on, off, and toggled. 
    // It is assumed that a single byte must be sent in the payload, 
    // which indicates the type of operation.

    /*
         payload.port = 25; 	 	 // This device receives commands on LoRaWAN port 25 
         payload.buildResult = downlinkBuildResult.ok; 
    
         switch (command.type) { 
               case commandType.onOff: 
                       switch (command.onOff.type) { 
                               case onOffCommandType.turnOn: 
                                       payload.setAsBytes([30]); 	 	 // Command ID 30 is "turn on" 
                                       break; 
                               case onOffCommandType.turnOff: 
                                       payload.setAsBytes([31]); 	 	 // Command ID 31 is "turn off" 
                                       break; 
                               case onOffCommandType.toggle: 
                                       payload.setAsBytes([32]); 	 	 // Command ID 32 is "toggle" 
                                       break; 
                               default: 
                                       payload.buildResult = downlinkBuildResult.unsupported; 
                                       break; 
                       } 
                       break; 
               default: 
                       payload.buildResult = downlinkBuildResult.unsupported; 
                       break; 
         }
    */

}

function S2120Decoder(bytes, port){
  
  //Objeto que vamos a devolver
  var decoded = {
    UvIndex:  null,
    AirTemperature: null,
    AirHumidity: null,
    LightIntensity: null, 
    BarometricPressure: null, 
    WindDirection: null, 
    WindSpeed: null,       
    RainfallHourly: null
  }

  
  //Decodificamos usando el payload decoder del fabricante del device para TTN
  let result = decodeUplink(bytes, port);

  result.data.messages.forEach(msg => 
  {
    msg.forEach(read => 
    {
      switch (read.measurementId)
      {
        case "4190":
          decoded.UvIndex = read.measurementValue;
          break;
        case "4097":
          decoded.AirTemperature =  read.measurementValue; 
          break;
        case "4098":
          decoded.AirHumidity = read.measurementValue;
          break;
        case "4099":
          decoded.LightIntensity = read.measurementValue;
          break;
        case "4101":
          decoded.BarometricPressure = read.measurementValue;
          break;
        case "4104":
          decoded.WindDirection = read.measurementValue;
          break;
        case "4105":
          decoded.WindSpeed = read.measurementValue;
          break;
        case "4113":
          decoded.RainfallHourly = read.measurementValue;
          break;
      }  
    });
  });
  
  return decoded;

};


/**
 * Entry, decoder.js
 */
function decodeUplink(input, port) {
    // data split

    var bytes = input['bytes']
    // init
    bytes = bytes2HexString(bytes)
        .toLocaleUpperCase()

    let result = {
        'err': 0, 'payload': bytes, 'valid': true, messages: []
    }
    let splitArray = dataSplit(bytes)
    // data decoder
    let decoderArray = []
    for (let i = 0; i < splitArray.length; i++) {
        let item = splitArray[i]
        let dataId = item.dataId
        let dataValue = item.dataValue
        let messages = dataIdAndDataValueJudge(dataId, dataValue)
        decoderArray.push(messages)
    }
    result.messages = decoderArray
    return { data: result }
}

/**
 * data splits
 * @param bytes
 * @returns {*[]}
 */
function dataSplit(bytes) {
    let frameArray = []

    for (let i = 0; i < bytes.length; i++) {
        let remainingValue = bytes
        let dataId = remainingValue.substring(0, 2)
        let dataValue
        let dataObj = {}
        switch (dataId) {
            case '01':
            case '20':
            case '21':
            case '30':
            case '31':
            case '33':
            case '40':
            case '41':
            case '42':
            case '43':
            case '44':
            case '45':
                dataValue = remainingValue.substring(2, 22)
                bytes = remainingValue.substring(22)
                dataObj = {
                    'dataId': dataId, 'dataValue': dataValue
                }
                break
            case '02':
                dataValue = remainingValue.substring(2, 18)
                bytes = remainingValue.substring(18)
                dataObj = {
                    'dataId': '02', 'dataValue': dataValue
                }
                break
            case '03':
            case '06':
                dataValue = remainingValue.substring(2, 4)
                bytes = remainingValue.substring(4)
                dataObj = {
                    'dataId': dataId, 'dataValue': dataValue
                }
                break
            case '05':
            case '34':
                dataValue = bytes.substring(2, 10)
                bytes = remainingValue.substring(10)
                dataObj = {
                    'dataId': dataId, 'dataValue': dataValue
                }
                break
            case '04':
            case '10':
            case '32':
            case '35':
            case '36':
            case '37':
            case '38':
            case '39':
                dataValue = bytes.substring(2, 20)
                bytes = remainingValue.substring(20)
                dataObj = {
                    'dataId': dataId, 'dataValue': dataValue
                }
                break
            default:
                dataValue = '9'
                break
        }
        if (dataValue.length < 2) {
            break
        }
        frameArray.push(dataObj)
    }
    return frameArray
}

function dataIdAndDataValueJudge(dataId, dataValue) {
    let messages = []
    switch (dataId) {
        case '01':
            let temperature = dataValue.substring(0, 4)
            let humidity = dataValue.substring(4, 6)
            let illumination = dataValue.substring(6, 14)
            let uv = dataValue.substring(14, 16)
            let windSpeed = dataValue.substring(16, 20)
            messages = [{
                measurementValue: loraWANV2DataFormat(temperature, 10), measurementId: '4097', type: 'Air Temperature'
            }, {
                measurementValue: loraWANV2DataFormat(humidity), measurementId: '4098', type: 'Air Humidity'
            }, {
                measurementValue: loraWANV2DataFormat(illumination), measurementId: '4099', type: 'Light Intensity'
            }, {
                measurementValue: loraWANV2DataFormat(uv, 10), measurementId: '4190', type: 'UV Index'
            }, {
                measurementValue: loraWANV2DataFormat(windSpeed, 10), measurementId: '4105', type: 'Wind Speed'
            }]
            break
        case '02':
            let windDirection = dataValue.substring(0, 4)
            let rainfall = dataValue.substring(4, 12)
            let airPressure = dataValue.substring(12, 16)
            messages = [{
                measurementValue: loraWANV2DataFormat(windDirection), measurementId: '4104', type: 'Wind Direction Sensor'
            }, {
                measurementValue: loraWANV2DataFormat(rainfall, 1000), measurementId: '4113', type: 'Rain Gauge'
            }, {

                measurementValue: loraWANV2DataFormat(airPressure, 0.1), measurementId: '4101', type: 'Barometric Pressure'
            }]
            break
        case '03':
            let Electricity = dataValue
            messages = [{
                'Battery(%)': loraWANV2DataFormat(Electricity)}, 
                
                         ]
            break
        case '04':
            let electricityWhether = dataValue.substring(0, 2)
            let hwv = dataValue.substring(2, 6)
            let bdv = dataValue.substring(6, 10)
            let sensorAcquisitionInterval = dataValue.substring(10, 14)
            let gpsAcquisitionInterval = dataValue.substring(14, 18)
            messages = [{
                'Battery(%)': loraWANV2DataFormat(electricityWhether),
                'Hardware Version': `${loraWANV2DataFormat(hwv.substring(0, 2))}.${loraWANV2DataFormat(hwv.substring(2, 4))}`,
                'Firmware Version': `${loraWANV2DataFormat(bdv.substring(0, 2))}.${loraWANV2DataFormat(bdv.substring(2, 4))}`,
                'measureInterval': parseInt(loraWANV2DataFormat(sensorAcquisitionInterval)) * 60,
                'gpsInterval': parseInt(loraWANV2DataFormat(gpsAcquisitionInterval)) * 60
            }]
            break
        case '05':
            let sensorAcquisitionIntervalFive = dataValue.substring(0, 4)
            let gpsAcquisitionIntervalFive = dataValue.substring(4, 8)
            messages = [{
                'measureInterval': parseInt(loraWANV2DataFormat(sensorAcquisitionIntervalFive)) * 60,
                'gpsInterval': parseInt(loraWANV2DataFormat(gpsAcquisitionIntervalFive)) * 60
            }]
            break
        case '06':
            let errorCode = dataValue
            let descZh
            switch (errorCode) {
                case '00':
                    descZh = 'CCL_SENSOR_ERROR_NONE'
                    break
                case '01':
                    descZh = 'CCL_SENSOR_NOT_FOUND'
                    break
                case '02':
                    descZh = 'CCL_SENSOR_WAKEUP_ERROR'
                    break
                case '03':
                    descZh = 'CCL_SENSOR_NOT_RESPONSE'
                    break
                case '04':
                    descZh = 'CCL_SENSOR_DATA_EMPTY'
                    break
                case '05':
                    descZh = 'CCL_SENSOR_DATA_HEAD_ERROR'
                    break
                case '06':
                    descZh = 'CCL_SENSOR_DATA_CRC_ERROR'
                    break
                case '07':
                    descZh = 'CCL_SENSOR_DATA_B1_NO_VALID'
                    break
                case '08':
                    descZh = 'CCL_SENSOR_DATA_B2_NO_VALID'
                    break
                case '09':
                    descZh = 'CCL_SENSOR_RANDOM_NOT_MATCH'
                    break
                case '0A':
                    descZh = 'CCL_SENSOR_PUBKEY_SIGN_VERIFY_FAILED'
                    break
                case '0B':
                    descZh = 'CCL_SENSOR_DATA_SIGN_VERIFY_FAILED'
                    break
                case '0C':
                    descZh = 'CCL_SENSOR_DATA_VALUE_HI'
                    break
                case '0D':
                    descZh = 'CCL_SENSOR_DATA_VALUE_LOW'
                    break
                case '0E':
                    descZh = 'CCL_SENSOR_DATA_VALUE_MISSED'
                    break
                case '0F':
                    descZh = 'CCL_SENSOR_ARG_INVAILD'
                    break
                case '10':
                    descZh = 'CCL_SENSOR_RS485_MASTER_BUSY'
                    break
                case '11':
                    descZh = 'CCL_SENSOR_RS485_REV_DATA_ERROR'
                    break
                case '12':
                    descZh = 'CCL_SENSOR_RS485_REG_MISSED'
                    break
                case '13':
                    descZh = 'CCL_SENSOR_RS485_FUN_EXE_ERROR'
                    break
                case '14':
                    descZh = 'CCL_SENSOR_RS485_WRITE_STRATEGY_ERROR'
                    break
                case '15':
                    descZh = 'CCL_SENSOR_CONFIG_ERROR'
                    break
                case 'FF':
                    descZh = 'CCL_SENSOR_DATA_ERROR_UNKONW'
                    break
                default:
                    descZh = 'CC_OTHER_FAILED'
                    break
            }
            messages = [{
                measurementId: '4101', type: 'sensor_error_event', errCode: errorCode, descZh
            }]
            break
        case '10':
            let statusValue = dataValue.substring(0, 2)
            let { status, type } = loraWANV2BitDataFormat(statusValue)
            let sensecapId = dataValue.substring(2)
            messages = [{
                status: status, channelType: type, sensorEui: sensecapId
            }]
            break
        default:
            break
    }
    return messages
}

/**
 *
 * data formatting
 * @param str
 * @param divisor
 * @returns {string|number}
 */
function loraWANV2DataFormat(str, divisor = 1) {
    let strReverse = bigEndianTransform(str)
    let str2 = toBinary(strReverse)
    if (str2.substring(0, 1) === '1') {
        let arr = str2.split('')
        let reverseArr = arr.map((item) => {
            if (parseInt(item) === 1) {
                return 0
            } else {
                return 1
            }
        })
        str2 = parseInt(reverseArr.join(''), 2) + 1
        return '-' + str2 / divisor
    }
    return parseInt(str2, 2) / divisor
}

/**
 * Handling big-endian data formats
 * @param data
 * @returns {*[]}
 */
function bigEndianTransform(data) {
    let dataArray = []
    for (let i = 0; i < data.length; i += 2) {
        dataArray.push(data.substring(i, i + 2))
    }
    // array of hex
    return dataArray
}

/**
 * Convert to an 8-digit binary number with 0s in front of the number
 * @param arr
 * @returns {string}
 */
function toBinary(arr) {
    let binaryData = arr.map((item) => {
        let data = parseInt(item, 16)
            .toString(2)
        let dataLength = data.length
        if (data.length !== 8) {
            for (let i = 0; i < 8 - dataLength; i++) {
                data = `0` + data
            }
        }
        return data
    })
    let ret = binaryData.toString()
        .replace(/,/g, '')
    return ret
}

/**
 * sensor
 * @param str
 * @returns {{channel: number, type: number, status: number}}
 */
function loraWANV2BitDataFormat(str) {
    let strReverse = bigEndianTransform(str)
    let str2 = toBinary(strReverse)
    let channel = parseInt(str2.substring(0, 4), 2)
    let status = parseInt(str2.substring(4, 5), 2)
    let type = parseInt(str2.substring(5), 2)
    return { channel, status, type }
}

/**
 * channel info
 * @param str
 * @returns {{channelTwo: number, channelOne: number}}
 */
function loraWANV2ChannelBitFormat(str) {
    let strReverse = bigEndianTransform(str)
    let str2 = toBinary(strReverse)
    let one = parseInt(str2.substring(0, 4), 2)
    let two = parseInt(str2.substring(4, 8), 2)
    let resultInfo = {
        one: one, two: two
    }
    return resultInfo
}

/**
 * data log status bit
 * @param str
 * @returns {{total: number, level: number, isTH: number}}
 */
function loraWANV2DataLogBitFormat(str) {
    let strReverse = bigEndianTransform(str)
    let str2 = toBinary(strReverse)
    let isTH = parseInt(str2.substring(0, 1), 2)
    let total = parseInt(str2.substring(1, 5), 2)
    let left = parseInt(str2.substring(5), 2)
    let resultInfo = {
        isTH: isTH, total: total, left: left
    }
    return resultInfo
}

function bytes2HexString(arrBytes) {
    var str = ''
    for (var i = 0; i < arrBytes.length; i++) {
        var tmp
        var num = arrBytes[i]
        if (num < 0) {
            tmp = (255 + num + 1).toString(16)
        } else {
            tmp = num.toString(16)
        }
        if (tmp.length === 1) {
            tmp = '0' + tmp
        }
        str += tmp
    }
    return str
}
