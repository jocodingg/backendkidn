const mqtt = require('mqtt');
require('dotenv').config();
const { insertEddyRaw } = require('../models/eddyModel');
const { insertAirRaw } = require('../models/airModel');
const { pushEddy, pushAir } = require('../utils/aggregator');

const TOPIC_EDDY = process.env.TOPIC_EDDY || 'skyflux/eddy';
const TOPIC_AIR  = process.env.TOPIC_AIR  || 'skyflux/air';
const LINKMQTT = process.env.LINKMQTT;

let client = null;

function start() {
  const options = {
    username: process.env.USERNAMEMQTT,
    password: process.env.PASSWORDMQTT,
    reconnectPeriod: 5000
  };
  client = mqtt.connect(LINKMQTT, options);

  client.on('connect', () => {
    console.log('MQTT connected');
    client.subscribe([TOPIC_EDDY, TOPIC_AIR], (err) => {
      if (err) console.error('subscribe error', err);
      else console.log('subscribed to', TOPIC_EDDY, TOPIC_AIR);
    });
  });

  client.on('reconnect', () => console.log('MQTT reconnecting...'));
  client.on('error', (e) => console.error('MQTT error', e));
  client.on('offline', () => console.log('MQTT offline'));

  client.on('message', async (topic, payload) => {
    try {
      const msg = payload.toString();
      const data = JSON.parse(msg);
      const ts = data.timestamp ? new Date(data.timestamp) : new Date();
      if (topic === TOPIC_EDDY) {
        // expected fields: source, co2,ch4,suhu,kelembapan,h2o,tekanan
        const row = {
          timestamp: ts.toISOString(),
          source: data.source || 'unknown',
          co2: data.co2 != null ? Number(data.co2) : null,
          ch4: data.ch4 != null ? Number(data.ch4) : null,
          suhu: data.suhu != null ? Number(data.suhu) : null,
          kelembapan: data.kelembapan != null ? Number(data.kelembapan) : null,
          h2o: data.h2o != null ? Number(data.h2o) : null,
          tekanan: data.tekanan != null ? Number(data.tekanan) : null
        };
        // insert raw
        insertEddyRaw({...row, timestamp: row.timestamp}).catch(err => console.error('insert eddyraw', err));
        // push for aggregator
        pushEddy(row);
      } else if (topic === TOPIC_AIR) {
        // expected fields: source, pm25, voc
        const row = {
          timestamp: ts.toISOString(),
          source: data.source || 'unknown',
          pm25: data.pm25 != null ? Number(data.pm25) : null,
          voc: data.voc != null ? Number(data.voc) : null
        };
        insertAirRaw(row).catch(err => console.error('insert airraw', err));
        // TAMBAHKAN INI
        pushAir(row);
      }
    } catch (err) {
      console.error('MQTT message parse error', err, payload.toString());
    }
  });
}

module.exports = { start };
