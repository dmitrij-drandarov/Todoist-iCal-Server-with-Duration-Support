const express = require('express');
const router = express.Router();
const fs = require('fs');
const ical = require('ical-generator');
const request = require('request-promise');
let cal;

/* GET users listing. */
router.get('/', async function (req, res) {
    let token = fs.readFileSync('./.token', 'utf8');
    if (token === "") {
        token = req.url.split("?")[1];
        if (token === undefined) {
            res.render('error', {message: 'No token key set...'});
        }
    }
    console.log(token);


    await pullTasks(token);


    res.type('text/calendar');
    cal.serve(res);
});

async function pullTasks(token) {
    cal = ical({
        domain: 'dmitrij-drandarov.com',
        name: 'custom-todoist-ical',
        prodId: {company: 'dmitrij-drandarov.com', product: 'custom-todoist-ical'}});


    let uri = `https://beta.todoist.com/API/v8/tasks?token=${token}`;
    const options = {
        method: 'GET',
        uri: uri
    };
    console.log(uri);


    await request(options)
        .then(response => {
            console.log(response);
            processTasks(response);
        });
}

function processTasks(jsonTasks) {
    JSON.parse(jsonTasks).forEach(task => {
        if (task.due && task.due.date) {
            console.log(task.content);
            addEvent(task);
        }
    });
}

function addEvent(task) {
    let start = new Date(task.due.date);
    let end = new Date(start.getTime() + 3600000);
    let allDay = true;


    // Date + Time
    if (task.due.datetime) {
        allDay = false;
        start = new Date(task.due.datetime);
        end = new Date(start.getTime() + 3600000);


        // Date + Time + Duration
        if (/\dh\s-\s/.test(task.content)) {
            end = new Date(start.getTime() + (parseFloat(task.content.split('h - ')[0].replace(',', '.')) * 3600000));
        }
    }

    if (allDay) {
        cal.createEvent({
            uid: task.id,
            start: start,
            allDay: allDay,
            summary: task.content,
            description: `Description: ${task.content}`
        });
    } else {
        cal.createEvent({
            uid: task.id,
            start: start,
            end: end,
            summary: task.content,
            description: `Description: ${task.content}`
        })
    }
}

module.exports = router;
