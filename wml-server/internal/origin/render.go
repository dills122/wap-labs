package origin

import (
	"html"
	"strings"
	"time"
)

var sampleMessages = []string{
	"Gateway notice: bearerbox is running.",
	"Tip: Use options softkey to navigate.",
	"Reminder: WML decks can contain many cards.",
	"Debug: Check the internal metrics listener for request counters.",
	"Exercise: Add your own card to the portal.",
}

func xmlEscape(value string) string {
	return html.EscapeString(value)
}

func renderHomeDeck() string {
	return `<card id="home" title="WAP Lab">` +
		`<p>Local WAP training environment.</p>` +
		`<p><a href="#menu">Open Menu</a></p>` +
		`<do type="accept" label="Menu"><go href="#menu"/></do>` +
		`</card>` +
		`<card id="menu" title="Main Menu">` +
		`<p><a href="/login">1. Login</a></p>` +
		`<p><a href="/register">2. Register</a></p>` +
		`<p><a href="/about">3. About Stack</a></p>` +
		`<p><a href="/examples/index.wml">4. Example Directory</a></p>` +
		`<p><a href="/examples/pocket-portal.wml">5. Pocket Portal</a></p>` +
		`<do type="options" label="About"><go href="/about"/></do>` +
		`<do type="prev" label="Back"><prev/></do>` +
		`</card>`
}

func renderFormsHomeDeck() string {
	return `<card id="forms" title="Forms Lab">` +
		`<p>Deterministic registration and login exercises.</p>` +
		`<p><a href="/register">Register a demo user</a></p>` +
		`<p><a href="/login">Login to the portal</a></p>` +
		`<p><a href="/examples/preferences.wml">Try local preferences</a></p>` +
		`<do type="accept" label="Register"><go href="/register"/></do>` +
		`</card>`
}

func renderInteropHomeDeck() string {
	return `<card id="interop" title="Interop Lab">` +
		`<p>Deterministic WML response profile.</p>` +
		`<p>Content type: text/vnd.wap.wml</p>` +
		`<p><a href="/examples/interop-check.wml">WML 1.3 wire check</a></p>` +
		`<p><a href="/examples/index.wml">Example directory</a></p>` +
		`<do type="accept" label="Wire Check"><go href="/examples/interop-check.wml"/></do>` +
		`</card>`
}

func renderLoginDeck(prefillUser, errorMessage, actionID string) string {
	message := `<p>Enter username and PIN.</p>`
	if errorMessage != "" {
		message = `<p>Login error: ` + xmlEscape(errorMessage) + `</p>`
	}
	return `<card id="login" title="Login">` +
		message +
		`<p>User: <input name="username" value="` + xmlEscape(prefillUser) + `" title="User" format="*M" emptyok="false"/></p>` +
		`<p>PIN: <input name="pin" type="password" title="PIN" format="*N" maxlength="6" emptyok="false"/></p>` +
		`<do type="accept" label="Submit"><go method="post" href="` + formAction("/login", actionID) + `">` +
		`<postfield name="username" value="$(username)"/>` +
		`<postfield name="pin" value="$(pin)"/>` +
		`</go></do>` +
		`<do type="options" label="Register"><go href="/register"/></do>` +
		`<do type="prev" label="Home"><go href="/"/></do>` +
		`</card>`
}

func renderRegisterDeck(prefillUser, errorMessage, actionID string) string {
	message := `<p>Create account for demo login.</p>`
	if errorMessage != "" {
		message = `<p>Registration error: ` + xmlEscape(errorMessage) + `</p>`
	}
	return `<card id="register" title="Register">` +
		message +
		`<p>User: <input name="username" value="` + xmlEscape(prefillUser) + `" title="User" format="*M" emptyok="false"/></p>` +
		`<p>PIN: <input name="pin" type="password" title="PIN" format="*N" maxlength="6" emptyok="false"/></p>` +
		`<do type="accept" label="Create"><go method="post" href="` + formAction("/register", actionID) + `">` +
		`<postfield name="username" value="$(username)"/>` +
		`<postfield name="pin" value="$(pin)"/>` +
		`</go></do>` +
		`<do type="options" label="Login"><go href="/login"/></do>` +
		`<do type="prev" label="Home"><go href="/"/></do>` +
		`</card>`
}

func formAction(path, actionID string) string {
	if actionID == "" {
		return path
	}
	return path + "?e2e_action=" + xmlEscape(actionID)
}

func renderLoginSuccess(username, sid string, _ time.Time) string {
	return `<card id="login-ok" title="Login OK">` +
		`<p>Authenticated as ` + xmlEscape(username) + `.</p>` +
		`<p><a href="/portal?sid=` + xmlEscape(sid) + `">Open Portal</a></p>` +
		`<do type="accept" label="Portal"><go href="/portal?sid=` + xmlEscape(sid) + `"/></do>` +
		`</card>`
}

func renderRegisterSuccess(username string) string {
	return `<card id="register-ok" title="Registration OK">` +
		`<p>User ` + xmlEscape(username) + ` created.</p>` +
		`<p><a href="/login">Continue to login</a></p>` +
		`<do type="accept" label="Login"><go href="/login"/></do>` +
		`</card>`
}

func renderPortalDeck(current currentSession) string {
	user := xmlEscape(current.Username)
	sid := xmlEscape(current.ID)
	createdAt := xmlEscape(current.CreatedAt.Format(time.RFC3339Nano))
	return `<card id="portal" title="Portal">` +
		`<p>Welcome, ` + user + `</p>` +
		`<p>Session: ` + sid + `</p>` +
		`<p>Since: ` + createdAt + `</p>` +
		`<p><a href="/profile?sid=` + sid + `">Profile</a></p>` +
		`<p><a href="/messages?sid=` + sid + `&amp;page=1">Messages</a></p>` +
		`<p><a href="/logout?sid=` + sid + `">Logout</a></p>` +
		`<do type="options" label="Messages"><go href="/messages?sid=` + sid + `&amp;page=1"/></do>` +
		`<do type="prev" label="Home"><go href="/"/></do>` +
		`</card>`
}

func renderProfileDeck(current currentSession, createdAt string) string {
	sid := xmlEscape(current.ID)
	return `<card id="profile" title="Profile">` +
		`<p>User: ` + xmlEscape(current.Username) + `</p>` +
		`<p>Account created: ` + xmlEscape(createdAt) + `</p>` +
		`<p><a href="/portal?sid=` + sid + `">Back to portal</a></p>` +
		`<do type="prev" label="Portal"><go href="/portal?sid=` + sid + `"/></do>` +
		`</card>`
}

func renderMessagesDeck(sessionID string, page int) string {
	start := (page - 1) * pageSize
	end := start + pageSize
	if end > len(sampleMessages) {
		end = len(sampleMessages)
	}
	items := []string(nil)
	if start >= 0 && start < len(sampleMessages) {
		items = sampleMessages[start:end]
	}
	hasPrevious := page > 1
	hasNext := start+pageSize < len(sampleMessages)
	sid := xmlEscape(sessionID)

	var body strings.Builder
	body.WriteString(`<card id="messages" title="Messages">`)
	if len(items) == 0 {
		body.WriteString(`<p>No messages on this page.</p>`)
	} else {
		for _, message := range items {
			body.WriteString(`<p>- ` + xmlEscape(message) + `</p>`)
		}
	}
	if hasPrevious {
		body.WriteString(`<p><a href="/messages?sid=` + sid + `&amp;page=` + itoa(page-1) + `">Prev Page</a></p>`)
	}
	if hasNext {
		body.WriteString(`<p><a href="/messages?sid=` + sid + `&amp;page=` + itoa(page+1) + `">Next Page</a></p>`)
	}
	body.WriteString(`<p><a href="/portal?sid=` + sid + `">Back to portal</a></p>`)
	if hasNext {
		body.WriteString(`<do type="accept" label="Next"><go href="/messages?sid=` + sid + `&amp;page=` + itoa(page+1) + `"/></do>`)
	}
	body.WriteString(`<do type="prev" label="Portal"><go href="/portal?sid=` + sid + `"/></do></card>`)
	return body.String()
}

func renderLogoutDeck() string {
	return `<card id="logout" title="Logged Out">` +
		`<p>Your session has ended.</p>` +
		`<p><a href="/">Return home</a></p>` +
		`<do type="accept" label="Home"><go href="/"/></do>` +
		`</card>`
}

func errorCard(title, message string) string {
	return `<card id="error" title="` + xmlEscape(title) + `"><p>` + xmlEscape(message) + `</p></card>`
}

func itoa(value int) string {
	if value == 0 {
		return "0"
	}
	var buffer [20]byte
	index := len(buffer)
	for value > 0 {
		index--
		buffer[index] = byte('0' + value%10)
		value /= 10
	}
	return string(buffer[index:])
}
