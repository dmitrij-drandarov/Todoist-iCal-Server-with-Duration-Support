const express = require('express');
const router = express.Router();
const fs = require('fs');
const ical = require('ical-generator');
const request = require('request-promise');
let cal;

/* GET users listing. */
router.get('/', async function (req, res) {
    cal = ical({domain: 'dmitrij-drandarov.com', name: 'Custom Todoist iCal'}).valueOf();

    await pullTasks();
    res.type('text/calendar');
    cal.serve(res);
});

async function pullTasks() {
    let token = fs.readFileSync('./.token', 'utf8');
    console.log(token);

    const options = {
        method: 'GET',
        uri: 'https://beta.todoist.com/API/v8/tasks',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    await request(options)
        .then(response => {
            console.log(response);
            processTasks(response);
        });
}

function processTasks(jsonTasks) {

    JSON.parse(jsonTasks).forEach(task => {
        if (task.due && task.due.date) {
            addEvent(task);
        }
    });

    console.log(cal.toString());
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
            end = new Date(start.getTime() + (parseInt(task.content.split('h - ')[0]) * 3600000));
        }
    }

    if (allDay) {
        cal.createEvent({
            start: start,
            allDay: allDay,
            summary: task.content,
            description: `Description: ${task.content}`
        });
    }
    else {
        cal.createEvent({
            start: start,
            end: end,
            summary: task.content,
            description: `Description: ${task.content}`
        })
    }
}

module.exports = router;
