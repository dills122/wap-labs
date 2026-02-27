const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const users = new Map();
const sessions = new Map();
const counters = {
  requests: 0,
  registered: 0,
  loginSuccess: 0,
  loginFailure: 0,
};

const sampleMessages = [
  'Gateway notice: bearerbox is running.',
  'Tip: Use options softkey to navigate.',
  'Reminder: WML decks can contain many cards.',
  'Debug: Check /metrics for request counters.',
  'Exercise: Add your own card to the portal.',
];

let reqSeq = 1;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use((req, res, next) => {
  counters.requests += 1;
  const reqId = reqSeq;
  reqSeq += 1;
  req.requestId = reqId;
  const ua = req.get('user-agent') || '';
  const accept = req.get('accept') || '';
  console.log(
    `[gateway-request] id=${reqId} ts=${new Date().toISOString()} method=${req.method} path=${req.originalUrl} ip=${req.ip} ua="${ua}" accept="${accept}"`
  );
  next();
});

function xmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sendWml(res, body, statusCode = 200) {
  const document =
    '<?xml version="1.0"?>\n' +
    '<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.1//EN" "http://www.wapforum.org/DTD/wml_1.1.xml">\n' +
    `<wml>\n${body}\n</wml>\n`;

  res.status(statusCode);
  res.set('Content-Type', 'text/vnd.wap.wml; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  res.send(document);
}

function sendStaticWml(res, fileName) {
  const filePath = path.join(__dirname, 'routes', fileName);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      sendWml(
        res,
        `<card id="error" title="Error"><p>Unable to load ${xmlEscape(fileName)}</p><do type="prev" label="Back"><prev/></do></card>`,
        500
      );
      return;
    }
    res.set('Content-Type', 'text/vnd.wap.wml; charset=utf-8');
    res.set('Cache-Control', 'no-store');
    res.send(data);
  });
}

function createSession(username) {
  const sid = crypto.randomBytes(8).toString('hex');
  sessions.set(sid, {
    username,
    createdAt: new Date().toISOString(),
  });
  return sid;
}

function getSession(req) {
  const sid = (req.query.sid || req.body.sid || '').trim();
  if (!sid) {
    return null;
  }
  const session = sessions.get(sid);
  if (!session) {
    return null;
  }
  return { sid, ...session };
}

function requireSession(req, res) {
  const session = getSession(req);
  if (session) {
    return session;
  }

  sendWml(
    res,
    '<card id="expired" title="Session Required">' +
      '<p>Your session is invalid or expired.</p>' +
      '<p><a href="/login">Login again</a></p>' +
      '<do type="accept" label="Login"><go href="/login"/></do>' +
      '</card>',
    401
  );

  return null;
}

function renderHomeDeck() {
  return (
    '<card id="home" title="WAP Lab">' +
      '<p>Local WAP training environment.</p>' +
      '<p><a href="#menu">Open Menu</a></p>' +
      '<do type="accept" label="Menu"><go href="#menu"/></do>' +
      '</card>' +
      '<card id="menu" title="Main Menu">' +
      '<p><a href="/login">1. Login</a></p>' +
      '<p><a href="/register">2. Register</a></p>' +
      '<p><a href="/about">3. About Stack</a></p>' +
      '<p><a href="/examples/index.wml">4. Static Example</a></p>' +
      '<do type="options" label="About"><go href="/about"/></do>' +
      '<do type="prev" label="Back"><prev/></do>' +
      '</card>'
  );
}

function renderLoginDeck(prefillUser, errorMessage) {
  const user = xmlEscape(prefillUser || '');
  const error = errorMessage
    ? `<p>Login error: ${xmlEscape(errorMessage)}</p>`
    : '<p>Enter username and PIN.</p>';

  return (
    '<card id="login" title="Login">' +
      error +
      `<p>User: <input name="username" value="${user}" title="User" format="*M" emptyok="false"/></p>` +
      '<p>PIN: <input name="pin" title="PIN" format="*N" maxlength="6" emptyok="false"/></p>' +
      '<do type="accept" label="Submit">' +
        '<go method="post" href="/login">' +
          '<postfield name="username" value="$(username)"/>' +
          '<postfield name="pin" value="$(pin)"/>' +
        '</go>' +
      '</do>' +
      '<do type="options" label="Register"><go href="/register"/></do>' +
      '<do type="prev" label="Home"><go href="/"/></do>' +
      '</card>'
  );
}

function renderRegisterDeck(prefillUser, errorMessage) {
  const user = xmlEscape(prefillUser || '');
  const error = errorMessage
    ? `<p>Registration error: ${xmlEscape(errorMessage)}</p>`
    : '<p>Create account for demo login.</p>';

  return (
    '<card id="register" title="Register">' +
      error +
      `<p>User: <input name="username" value="${user}" title="User" format="*M" emptyok="false"/></p>` +
      '<p>PIN: <input name="pin" title="PIN" format="*N" maxlength="6" emptyok="false"/></p>' +
      '<do type="accept" label="Create">' +
        '<go method="post" href="/register">' +
          '<postfield name="username" value="$(username)"/>' +
          '<postfield name="pin" value="$(pin)"/>' +
        '</go>' +
      '</do>' +
      '<do type="options" label="Login"><go href="/login"/></do>' +
      '<do type="prev" label="Home"><go href="/"/></do>' +
      '</card>'
  );
}

function renderPortalDeck(session) {
  const user = xmlEscape(session.username);
  const sid = xmlEscape(session.sid);
  const createdAt = xmlEscape(session.createdAt);

  return (
    '<card id="portal" title="Portal">' +
      `<p>Welcome, ${user}</p>` +
      `<p>Session: ${sid}</p>` +
      `<p>Since: ${createdAt}</p>` +
      `<p><a href="/profile?sid=${sid}">Profile</a></p>` +
      `<p><a href="/messages?sid=${sid}&amp;page=1">Messages</a></p>` +
      `<p><a href="/logout?sid=${sid}">Logout</a></p>` +
      '<do type="options" label="Messages">' +
        `<go href="/messages?sid=${sid}&amp;page=1"/>` +
      '</do>' +
      '<do type="prev" label="Home"><go href="/"/></do>' +
      '</card>'
  );
}

app.get('/', (req, res) => {
  sendWml(res, renderHomeDeck());
});

app.get('/about', (req, res) => {
  sendWml(
    res,
    '<card id="about" title="About WAP Lab">' +
      '<p>Client -> WSP -> Kannel -> HTTP -> WML app.</p>' +
      '<p>Gateway endpoint: http://localhost:13002</p>' +
      '<p>Admin endpoint: http://localhost:13000/status</p>' +
      '<p><a href="/">Back Home</a></p>' +
      '<do type="accept" label="Home"><go href="/"/></do>' +
      '</card>'
  );
});

app.get('/login', (req, res) => {
  sendWml(res, renderLoginDeck('', ''));
});

app.post('/login', (req, res) => {
  const username = (req.body.username || '').trim();
  const pin = (req.body.pin || '').trim();

  if (!username || !pin) {
    counters.loginFailure += 1;
    sendWml(res, renderLoginDeck(username, 'Username and PIN are required.'));
    return;
  }

  const account = users.get(username);
  if (!account || account.pin !== pin) {
    counters.loginFailure += 1;
    sendWml(res, renderLoginDeck(username, 'Invalid username or PIN.'));
    return;
  }

  counters.loginSuccess += 1;
  const sid = createSession(username);
  sendWml(
    res,
    '<card id="login-ok" title="Login OK">' +
      `<p>Authenticated as ${xmlEscape(username)}.</p>` +
      `<p><a href="/portal?sid=${xmlEscape(sid)}">Open Portal</a></p>` +
      '<do type="accept" label="Portal">' +
        `<go href="/portal?sid=${xmlEscape(sid)}"/>` +
      '</do>' +
      '</card>'
  );
});

app.get('/register', (req, res) => {
  sendWml(res, renderRegisterDeck('', ''));
});

app.post('/register', (req, res) => {
  const username = (req.body.username || '').trim();
  const pin = (req.body.pin || '').trim();

  if (!username || !pin) {
    sendWml(res, renderRegisterDeck(username, 'Username and PIN are required.'));
    return;
  }

  if (!/^\d{4,6}$/.test(pin)) {
    sendWml(res, renderRegisterDeck(username, 'PIN must be 4-6 digits.'));
    return;
  }

  if (users.has(username)) {
    sendWml(res, renderRegisterDeck(username, 'Username already exists.'));
    return;
  }

  users.set(username, {
    pin,
    createdAt: new Date().toISOString(),
  });
  counters.registered += 1;

  sendWml(
    res,
    '<card id="register-ok" title="Registration OK">' +
      `<p>User ${xmlEscape(username)} created.</p>` +
      '<p><a href="/login">Continue to login</a></p>' +
      '<do type="accept" label="Login"><go href="/login"/></do>' +
      '</card>'
  );
});

app.get('/portal', (req, res) => {
  const session = requireSession(req, res);
  if (!session) {
    return;
  }

  sendWml(res, renderPortalDeck(session));
});

app.get('/profile', (req, res) => {
  const session = requireSession(req, res);
  if (!session) {
    return;
  }

  const user = users.get(session.username);
  sendWml(
    res,
    '<card id="profile" title="Profile">' +
      `<p>User: ${xmlEscape(session.username)}</p>` +
      `<p>Account created: ${xmlEscape(user ? user.createdAt : 'unknown')}</p>` +
      `<p><a href="/portal?sid=${xmlEscape(session.sid)}">Back to portal</a></p>` +
      '<do type="prev" label="Portal">' +
        `<go href="/portal?sid=${xmlEscape(session.sid)}"/>` +
      '</do>' +
      '</card>'
  );
});

app.get('/messages', (req, res) => {
  const session = requireSession(req, res);
  if (!session) {
    return;
  }

  const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
  const pageSize = 2;
  const start = (page - 1) * pageSize;
  const pageItems = sampleMessages.slice(start, start + pageSize);
  const hasPrev = page > 1;
  const hasNext = start + pageSize < sampleMessages.length;
  const sid = xmlEscape(session.sid);

  let body = '<card id="messages" title="Messages">';
  if (pageItems.length === 0) {
    body += '<p>No messages on this page.</p>';
  } else {
    pageItems.forEach((msg) => {
      body += `<p>- ${xmlEscape(msg)}</p>`;
    });
  }

  if (hasPrev) {
    body += `<p><a href="/messages?sid=${sid}&amp;page=${page - 1}">Prev Page</a></p>`;
  }
  if (hasNext) {
    body += `<p><a href="/messages?sid=${sid}&amp;page=${page + 1}">Next Page</a></p>`;
  }

  body += `<p><a href="/portal?sid=${sid}">Back to portal</a></p>`;
  if (hasNext) {
    body += '<do type="accept" label="Next">';
    body += `<go href="/messages?sid=${sid}&amp;page=${page + 1}"/>`;
    body += '</do>';
  }
  body += '<do type="prev" label="Portal">';
  body += `<go href="/portal?sid=${sid}"/>`;
  body += '</do>';
  body += '</card>';

  sendWml(res, body);
});

app.get('/logout', (req, res) => {
  const sid = (req.query.sid || '').trim();
  if (sid) {
    sessions.delete(sid);
  }

  sendWml(
    res,
    '<card id="logout" title="Logged Out">' +
      '<p>Your session has ended.</p>' +
      '<p><a href="/">Return home</a></p>' +
      '<do type="accept" label="Home"><go href="/"/></do>' +
      '</card>'
  );
});

app.get('/examples/:file', (req, res) => {
  const fileName = req.params.file || '';
  if (!/^[a-zA-Z0-9._-]+\.wml$/.test(fileName)) {
    sendWml(
      res,
      '<card id="bad-file" title="Invalid File"><p>Example file name must end in .wml</p></card>',
      400
    );
    return;
  }
  sendStaticWml(res, fileName);
});

app.get('/viewer', (req, res) => {
  res.sendFile(path.join(__dirname, 'viewer.html'));
});

app.get('/metrics', (req, res) => {
  res.type('text/plain').send(
    [
      `requests_total ${counters.requests}`,
      `users_total ${users.size}`,
      `sessions_total ${sessions.size}`,
      `register_success_total ${counters.registered}`,
      `login_success_total ${counters.loginSuccess}`,
      `login_failure_total ${counters.loginFailure}`,
    ].join('\n') + '\n'
  );
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'wml-server',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`WML server listening on port ${port}`);
});
