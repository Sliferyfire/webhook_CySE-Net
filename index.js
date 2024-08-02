const express = require('express')
const bodyParser = require('body-parser');
const {WebhookClient, Payload} = require('dialogflow-fulfillment');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
require('dotenv').config()

const app = express().use(bodyParser.json());

const email = process.env.EMAIL;
const pass = process.env.PASS;

async function buscarDireccion(direccion) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'webhook-CySeNet ' + email, 
      'Referer': 'https://computacionyservicio.mx/'
    }
  });

  if (response.ok) {
    const data = await response.json();
    if (data.length > 0) {
      return data[0]; // Devolver el primer resultado
    } else {
      throw new Error('Dirección no encontrada');
    }
  } else {
    const errorText = await response.text();
    throw new Error(`Error en la solicitud: ${errorText}`);
  }
}

let transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: email, 
    pass: pass 
  }
});

//-------------------------Rutas-------------------------

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.post('/webhook', (req, res) => {
  console.log('webhook');
  const agent = new WebhookClient({ request: req, response: res });
  //console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
  // console.log('Dialogflow Request body: ' + JSON.stringify(req.body));
 
  function welcome(agent) {
    agent.add(`Hola bienvenido a CySe-Net, ¿Como puedo ayudarte?`);
  }

  //-------------------------VALIDAR DIRECCION-------------------------

  function validarDireccion(agent) {
    const context = agent.context.get('infocliente');
    var direccion = context.parameters['address'];
    direccion = direccion + ', San Juan del Rio, Queretaro';
    console.log('Dirección: ', direccion);

    return buscarDireccion(direccion)
      .then((resultado) => {
        agent.add(`Gracias por proporcionar tu direccion.`);
        agent.add(`¿Ahora podrías decirme que día te gustaría agendar tu mantenimiento?`);
      })
      .catch((error) => {
        agent.add(`Lo siento pero no pude encontrar tu dirección.`);
        agent.add(`Pudes intentar a ingresar nuevamente el nombre de tu calle, intenta escribir tambien el tipo de calle (calle, avenida, privada, etc).`);
        agent.add(`Recuerda que yo solo puedo atender en la ciudad de San Juan del Rio, Querétaro`);
        agent.add(`Si vives fuera de esta ciudad o tu direccion no es encontrada, te recomiendo hablar directamente con nuestro asesor.`);
        const payloadJson = {
          "richContent": [
            [
              {
                "type": "description",
                "title": "Computacion y servicio",
                "text": [
                  "Telefono: 4271090104",
                  "Email: servicio@computacionyservicio.mx"
                ]
              }
            ]
          ]
        };
        agent.add(new Payload(agent.UNSPECIFIED, payloadJson, { rawPayload: true, sendAsMessage: true }));
        agent.setContext({
          name: 'nombreCliente',
          lifespan: 1,
          parameters: {}
        });

        agent.setContext({
          name: 'usuarioPreguntaMantenimiento-equipo-followup',
          lifespan: 1,
          parameters: {}
        });
      });
  }

  //-------------------------ENVIAR CORREO-------------------------

  async function agendarMantenimientoCorreo(agent) {
    const contextName = agent.context.get('nombreCliente');
    const context = agent.context.get('infoCliente');
    const name = contextName.parameters['person'];
    const address = context.parameters['address'];
    const date = context.parameters['date'];
    const time = context.parameters['time'];
    const PhoneNumber = context.parameters['phone-number'];
    let mensaje = {
      from: email,
      to: email,
      subject: 'Agenda de mantenimiento',
      text: `Nombre del cliente: ${name}\nDireccion: ${address}\nFecha: ${date}\nHora: ${time}\nTelefono de contacto: ${PhoneNumber}`,
      // text: 'Mantenimiento ' + tipoMantenimiento + ' en la fecha y hora: ' + dateTimeOriginal + ' en ' + locationOriginal,
    };
    const info = await transporter.sendMail(mensaje);
    console.log(info);

    agent.add(`Mantenimiento ${tipoMantenimiento} agendado para: ${dateTimeOriginal} en ${locationOriginal}`);
    agent.add(`Si necesita más ayuda, no dude en preguntar o comunicarse con un asesor.`);
    const payloadJson = {
      "richContent": [
        [
          {
            "type": "description",
            "title": "Computacion y servicio",
            "text": [
              "Telefono: 4271090104",
              "Email: servicio@computacionyservicio.mx"
            ]
          }
        ]
      ]
    };
    agent.add(new Payload(agent.UNSPECIFIED, payloadJson, { rawPayload: true, sendAsMessage: true }));
  }

  //-------------------------INTENT MAP-------------------------

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('agenda - calle', validarDireccion);
  intentMap.set('agendarMantenimientoCorreo', agendarMantenimientoCorreo);

  agent.handleRequest(intentMap);
  })

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
  });



  // async function agendarMantenimientoCorreo(agent) {
  //   const context = agent.context.get('horamantenimiento');
  //   const locationOriginal = context.parameters['location.original'];
  //   const dateTimeOriginal = context.parameters['date-time.original'][0];
  //   const tipoMantenimiento = context.parameters['tipoMantenimiento'];
  //   let mensaje = {
  //     from: email,
  //     to: email,
  //     subject: 'Agenda de mantenimiento',
  //     text: 'Mantenimiento ' + tipoMantenimiento + ' en la fecha y hora: ' + dateTimeOriginal + ' en ' + locationOriginal,
  //   };
  //   const info = await transporter.sendMail(mensaje);
  //   console.log(info);

  //   agent.add(`Mantenimiento ${tipoMantenimiento} agendado para: ${dateTimeOriginal} en ${locationOriginal}`);
  //   agent.add(`Si necesita más ayuda, no dude en preguntar o comunicarse con un asesor.`);
  //   const payloadJson = {
  //     "richContent": [
  //       [
  //         {
  //           "type": "description",
  //           "title": "Computacion y servicio",
  //           "text": [
  //             "Telefono: 4271090104",
  //             "Email: servicio@computacionyservicio.mx"
  //           ]
  //         }
  //       ]
  //     ]
  //   };
  //   agent.add(new Payload(agent.UNSPECIFIED, payloadJson, { rawPayload: true, sendAsMessage: true }));
  // }









  

  // function webhookPrueba(agent) {
  //   agent.add(`Hola desde el webhook`); 
  //   const payloadJson = {
  //     "richContent": [
  //       [
  //         {
  //           "type": "carousel",
  //           "items": [
  //             {
  //               "info": {
  //                 "key": "item1",
  //                 "synonyms": [
  //                   "Item 1"
  //                 ]
  //               },
  //               "title": "Gato 1",
  //               "description": "Gato 1",
  //               "image": {
  //                 "src": {
  //                   "rawUrl": "https://st3.depositphotos.com/1594920/14721/i/1600/depositphotos_147217377-stock-photo-european-cat-sitting-isolated-on.jpg"
  //                 }
  //               }
  //             },
  //             {
  //               "info": {
  //                 "key": "item2",
  //                 "synonyms": [
  //                   "Item 2"
  //                 ]
  //               },
  //               "title": "Gato 2",
  //               "description": "Gato 2",
  //               "image": {
  //                 "src": {
  //                   "rawUrl": "https://cdn.pixabay.com/photo/2017/08/22/16/23/cat-2669554_1280.png"
  //                 }
  //               }
  //             }
  //           ]
  //         }
  //       ]
  //     ]
  //   };
  //   agent.add(new Payload(agent.UNSPECIFIED, payloadJson, { rawPayload: true, sendAsMessage: true }));
  // }