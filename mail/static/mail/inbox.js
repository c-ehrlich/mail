document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Add event Listener to send email
  document.querySelector('#compose-form').onsubmit = send_mail;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

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

function send_mail() {
  // Insert substitute strings if subject or body are empty
  subject = document.querySelector('#compose-subject').value;
  if (subject === "") { subject = "(no subject)"; }
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
  .then(response => response.json())
  .then(result => {
    // Print result
    // success: 201, failure: 400
    // TODO maybe do something with this data?
    console.log(result);
  });
}


// View an email
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
    console.log(email);
    document.querySelector('#read-view-subject').innerHTML = truncate_subject(email.subject);
    document.querySelector('#read-view-sender').innerHTML = "From: " + email.sender;
    document.querySelector('#read-view-recipients').innerHTML = "To: " + email.recipients;
    document.querySelector('#read-view-timestamp').innerHTML = email.timestamp;
    document.querySelector('#read-view-body').innerHTML = email.body;

    // show "mark unread" and "archive"/"unarchive" buttons
    let user = document.querySelector('#user_email').innerHTML;
    if (email.sender != user) {
      mark_unread_button = document.querySelector('#read-view-mark-unread-button');
      mark_unread_button.style.display = 'inline-block';
      mark_unread_button.addEventListener('click', () => {
        mark_unread(email_id);
        load_mailbox('inbox');
      })
      if (email.archived === true) {
        unarchive_button = document.querySelector('#read-view-unarchive-button');
        unarchive_button.style.display = 'inline-block';
        unarchive_button.addEventListener('click', () => {
          unarchive(email_id);
          load_mailbox('inbox');
        });
      } else {
        archive_button = document.querySelector('#read-view-archive-button');
        archive_button.style.display = 'inline-block';
        archive_button.addEventListener('click', () => {
          archive(email_id);
          load_mailbox('inbox');
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
  email_li.classList.add('list-group-item');
  email_li.classList.add('container');
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
}

// mark an email as unread
// input: mail_id
function mark_unread(mail_id) {
  fetch(`/emails/${mail_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: false
    })
  })
}

// unarchive an email
// input: mail_id
function unarchive(mail_id) {
  fetch(`/emails/${mail_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
}