document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email(null));
  // document.querySelector('#compose').addEventListener('click', compose_email);

  // Add event Listener to send email
  document.querySelector('#compose-form').onsubmit = send_mail;

  // By default, load the inbox
  load_mailbox('inbox');
});


// Compose an email
// arg: email we are replying to (provide null to get a blank email)
function compose_email(email = null) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // We are not replaying to an email
  if (email === null) {
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  } else {
    // Set the composition fields to the right things
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = make_reply_subject(email);
    document.querySelector('#compose-body').value = make_reply_body(email);
  }
}


// Loads a mailbox
// Input: mailbox name
// Valid mailbox names: 'inbox', 'sent', 'archives'
function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#read-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view-title').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  document.querySelector('#emails-view-list').innerHTML = '';

  // Display emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => add_email(email));
  });
}


// Sends an email
function send_mail() {
  // Insert substitute strings if subject or body are empty
  subject = document.querySelector('#compose-subject').value;
  if (subject === "") { subject = "(no subject)"; }
  subject = truncate_subject(subject);
  body = document.querySelector('#compose-body').value;
  if (body === "") { body = "(no body text)"; }

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json());
}


// View an email
// Input: id of an email (int)
function view_email(email_id) {
  // Show the email and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#read-view').style.display =  'block';
  document.querySelector('#compose-view').style.display = 'none';

  document.querySelector('#read-view-mark-unread-button').style.display = 'none';
  document.querySelector('#read-view-unarchive-button').style.display = 'none';
  document.querySelector('#read-view-archive-button').style.display = 'none';

  // display the email
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#read-view-subject').innerHTML = truncate_subject(email.subject);
    document.querySelector('#read-view-sender').innerHTML = "From: " + email.sender;
    document.querySelector('#read-view-recipients').innerHTML = "To: " + email.recipients;
    document.querySelector('#read-view-timestamp').innerHTML = email.timestamp;
    document.querySelector('#read-view-body').innerHTML = email.body;

    document.querySelector('#read-view-reply-button').addEventListener('click', () => {
      compose_email(email);
    });

    // show "mark unread" and "archive"/"unarchive" buttons
    let user = document.querySelector('#user_email').innerHTML;
    if (email.sender != user) {
      mark_unread_button = document.querySelector('#read-view-mark-unread-button');
      mark_unread_button.style.display = 'inline-block';
      mark_unread_button.addEventListener('click', () => {
        mark_unread(email_id);
      })
      if (email.archived === true) {
        unarchive_button = document.querySelector('#read-view-unarchive-button');
        unarchive_button.style.display = 'inline-block';
        unarchive_button.addEventListener('click', () => {
          unarchive(email_id);
        });
      } else {
        archive_button = document.querySelector('#read-view-archive-button');
        archive_button.style.display = 'inline-block';
        archive_button.addEventListener('click', () => {
          archive(email_id);
        });
      }
    }
  });

  // mark the email as read
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });
}


// Display an email in a list
function add_email(email) {
  const email_li = document.createElement('li');
  // email_li.className = 'list-group-item';
  email_li.classList.add('container', 'list-group-item', 'email');
  // if email.read is true, also give it list-group-item-dark
  if (email.read === true) {
    email_li.classList.add('list-group-item-secondary');
  }
  // truncate title length if necessary
  email.subject = truncate_subject(email.subject);

  // Create email div
  email_li.innerHTML = `
    <div class="row">
      <div class="col-3 mail-item-sender">${email.sender}</div>
      <div class="col mail-item-subject">${email.subject}</div>
      <div class="col-2 mail-item-timestamp">${email.timestamp}</div>
    </div>`;

  // Add eventListener to the email div
  email_li.addEventListener('click', () => view_email(email.id));
  document.querySelector('#emails-view-list').append(email_li);
}


// +-------------------------------------------------------------+
// |                                                             | 
// |                      HELPER FUNCTIONS                       |
// |                                                             | 
// +-------------------------------------------------------------+

// truncate email title length
// truncates total length to 160 chars
// deletes any individual words over 50 chars
function truncate_subject(subject) {
  var words = subject.split(" ");
  var output = "";
  // strip words that are longer than 50 characters
  words.forEach(word => {
    if (word.length < 50) {
      output += word + " ";
    }
  });
  // remove whitespace from both sides of the string
  output = output.trim();
  // truncate output to max 160 characters
  if (output.length > 160) {
    output = output.substring(0, 160) + " ...";
  }
  return output;
}


// archive an email
// input: mail_id
function archive(mail_id) {
  fetch(`/emails/${mail_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
  .then(() => load_mailbox('inbox'));
}


// create the body of an email reply
// input: the email being replied to (JSON)
function make_reply_body(email) {
  return `\n`
       + `----------\n`
       + `On ${email.timestamp}, ${email.sender} wrote:\n`
       + `${email.body}`;
}


// create the subject of an email reply
// input: the email being replied to (JSON)
function make_reply_subject(email) {
  subject = email.subject;
  if (!subject.startsWith("Re: ")) {
    subject = "Re: " + subject;
  }
  return subject;
}


// mark an email as unread
// input: mail_id (int)
function mark_unread(mail_id) {
  fetch(`/emails/${mail_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: false
    })
  })
  .then(() => load_mailbox('inbox'));
}


// unarchive an email
// input: mail_id (int)
function unarchive(mail_id) {
  fetch(`/emails/${mail_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  .then(() => load_mailbox('inbox'));
}
