const express = require('express');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const jsonFile = 'db/db.json';

const generateId = (size) => {
    const nums = Array.from(Array(10).keys());
    const alphabets = Array.from({ length: 26 }, (e, i) =>
        String.fromCharCode("a".charCodeAt(0) + i)
    );
    const chars = [...nums, ...alphabets];

    const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max));

    return Array.from(Array(size), () => chars[getRandomInt(chars.length)]).join('');
}

const getNotes = async (filepath) => {
    const content = await readFile(path.join(__dirname, filepath), 'utf8');

    return JSON.parse(content);
}

const saveNote = async (filepath, content) => {
    let currentContent = await getNotes(filepath);

    content.id = generateId(5);

    currentContent.push(content);

    return await writeFile(path.join(__dirname, filepath), JSON.stringify(currentContent));
}

const deleteNote = async (filepath, noteId) => {
    let currentContent = await getNotes(filepath);

    let foundIndex = currentContent.findIndex(note => note.id === noteId);

    if (foundIndex !== -1) {
        currentContent.splice(foundIndex, 1);

        return await writeFile(path.join(__dirname, filepath), JSON.stringify(currentContent));
    } else {
        throw new Error('Note doesn\'t exist.');
    }
}

// API Routing
app.get('/api/notes', async (req, res) => {
    const content = await getNotes(jsonFile);

    res.json(content);
});

app.post('/api/notes', async (req, res) => {
    await saveNote(jsonFile, req.body);

    res.end();
});

app.delete('/api/notes/:id', async (req, res) => {
    const noteId = req.params.id;

    await deleteNote(jsonFile, noteId);

    res.end();
});

// HTML Routing
app.get('/notes', (req, res) => res.sendFile(path.join(__dirname, 'public/notes.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

app.listen(PORT, () => console.log(`App listening on PORT ${PORT}`));