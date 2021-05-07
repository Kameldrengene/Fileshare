const {app} = require('./index');
const request = require('supertest');
let token;
let id;
beforeAll(() => {
    process.env.NODE_ENV = 'test';
})

test('get welcome', async () => {

    const res = await request(app).get('/');
    const response = {"options":{"createNewUser":"/api/user/create","login":"api/auth/login"}}
    expect(res.status).toBe(200);
    expect(res.body).toEqual(response);

});

test('Create user', async () => {
    const res = await request(app).post('/api/user/create')
        .send('email=testesen@testesen.dk')
        .send('name=testesen')
        .send('age=30')
        .send('password=asdfasdf');
    const response = true
    token = res.body.token
    expect(res.status).toBe(200);
    expect(res.body.auth).toEqual(response);
});

test('login', async () => {
    const res = await request(app).post('/api/auth/login')
        .send('email=testesen@testesen.dk').send('password=asdfasdf')
        .set('Accept', 'application/json');
    id = res.body.id
    expect(res.status).toBe(200);
});

test('Get user by id', async () => {
    const res = await request(app).get('/api/user/'+id)
        .set('x-access-token',token);
    const response = "testesen"
    expect(res.status).toBe(200);
    expect(res.body.name).toEqual(response);
});

test('Update user', async () => {
    const res = await request(app).put('/api/user/update/'+id)
        .set('x-access-token',token)
        .send('email=testesen@testesen.dk')
        .send('name=testsucks')
        .send('age=30')
        .send('password=asdfasdf');
    const response = "testsucks"
    expect(res.status).toBe(200);
    expect(res.body.name).toEqual(response);
});

test('Get user files', async () => {
    const res = await request(app).get('/api/files/')
        .set('x-access-token',token)
    expect(res.status).toBe(200);
});

test('Upload file', async () => {
    const res = await request(app).post('/api/files/upload?path=/')
        .set('x-access-token',token)
        .attach("myfile","dtulogo.png")
    expect(res.status).toBe(201);
});

test('Create directory', async () => {
    const res = await request(app).post('/api/files/createdirectory?name=mappe2/')
        .set('x-access-token',token)
    expect(res.status).toBe(201);

});

test('Create directory', async () => {
    const res = await request(app).post('/api/files/createdirectory?path=/&name=mappe1/')
        .set('x-access-token',token)
    expect(res.status).toBe(201);

});

test('Get user files', async () => {
    const res = await request(app).get('/api/files/')
        .set('x-access-token',token)
    expect(res.status).toBe(200);
});

test('Rename file', async () => {
    const res = await request(app).put('/api/files/rename?oldpath=dtulogo.png&newname=dtu')
        .set('x-access-token',token)
    expect(res.status).toBe(201);

});

test('Rename directory', async () => {
    const res = await request(app).put('/api/files/rename?oldpath=mappe2/&newname=mappe3')
        .set('x-access-token',token)
    expect(res.status).toBe(201);

});

test('Rename file', async () => {
    const res = await request(app).put('/api/files/rename?oldpath=failed.png&newname=fail')
        .set('x-access-token',token)
    expect(res.status).toBe(500);

});

test('Move file', async () => {
    const res = await request(app).put('/api/files/move?oldpath=dtu.png&newdirectorypath=mappe1/')
        .set('x-access-token',token)
    expect(res.status).toBe(201);

});


test('Move file', async () => {
    const res = await request(app).put('/api/files/move?oldpath=dtu.png&newdirectorypath=mappe8/')
        .set('x-access-token',token)
    expect(res.status).toBe(406);

});

test('Move file', async () => {
    const res = await request(app).put('/api/files/move?oldpath=dtufail.png&newdirectorypath=mappe1/')
        .set('x-access-token',token)
    expect(res.status).toBe(406);

});

test('Download file', async () => {
    const res = await request(app).post('/api/files/download?path=mappe1/dtu.png')
        .set('x-access-token',token)
    expect(res.status).toBe(200);

});

test('Share link', async () => {
    const res = await request(app).post('/api/files/globaldownload?path=mappe1/dtu.png')
        .set('x-access-token',token)
    expect(res.status).toBe(200);

});

test('Delete file', async () => {
    const res = await request(app).delete('/api/files/delete?path=mappe1/dtu.png')
        .set('x-access-token',token)
    expect(res.status).toBe(200);

});

test('Delete folder', async () => {
    const res = await request(app).delete('/api/files/delete?path=mappe3/')
        .set('x-access-token',token)
    expect(res.status).toBe(200);

});


test('Delete user', async () => {
    const res = await request(app).delete('/api/user/delete/'+id)
        .set('x-access-token',token)
    expect(res.status).toBe(200);

});