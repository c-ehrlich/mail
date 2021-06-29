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
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
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
  console.log("trying to send mail");
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    // success: 201, failure: 400
    // ALL RECIPIENTS NEED TO BE REGISTERED ON HERE
    console.log(result);
  });
}

// Display an email
function add_email(email) {
  console.log(email);
  const email_li = document.createElement('li');
  // email_li.className = 'list-group-item';
  email_li.classList.add('list-group-item');
  email_li.classList.add('container');
  // if email.read is true, also give it list-group-item-dark
  if (email.read === true) {
    email_li.classList.add('list-group-item-dark');
  }
  email_li.innerHTML = `
    <div class="row">
      <div class="col-3 mail-item-sender">${email.sender}</div>
      <div class="col mail-item-subject">${email.subject}</div>
      <div class="col-2 mail-item-timestamp">${email.timestamp}</div>
    </div>
  `;
  document.querySelector('#emails-view-list').append(email_li);
}
