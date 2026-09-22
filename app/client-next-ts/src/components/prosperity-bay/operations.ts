/* Selected operations, checked against the official guides and API specifications, 14 Sep 2026.
   Paths omit host/version prefixes. This is a narrated example, never a live request log. */
// @ts-nocheck
const SGOperations = (() => {
  const base='https://developer.payments.jpmorgan.com';
  const ep=base+'/docs/embedded-finance-solutions/embedded-payments/capabilities/';
  const co=base+'/docs/commerce/online-payments/capabilities/checkout/';
  const spec=path=>base+'/api/llm-content?path='+encodeURIComponent('en/api/'+path+'.md');
  const sources={
    onboarding:{label:'Onboarding API',url:spec('embedded-finance-solutions/embedded-payments/onboarding-oas')},
    documents:{label:'Document submission guide',url:ep+'onboard-a-client/how-to/upload-documents'},
    accounts:{label:'Accounts API',url:spec('embedded-finance-solutions/embedded-payments/embedded-payments/accounts')},
    transfer:{label:'Funding guide',url:ep+'transactions/fund-account/how-to/initiate-transfers'},
    linked:{label:'Linked account guide',url:ep+'external-accounts/add-linked-account'},
    payout:{label:'Payout guide',url:ep+'transactions/payouts/how-to/linked-account'},
    transactions:{label:'Transactions API',url:spec('embedded-finance-solutions/embedded-payments/embedded-payments/transactions')},
    events:{label:'Notification guide',url:ep+'notification-subscriptions/how-to/notifications'},
    checkout:{label:'Checkout API',url:spec('commerce/online-payments/checkout/checkout-oas')},
    dropin:{label:'Drop-in UI guide',url:co+'drop-in-ui'},hosted:{label:'Hosted page guide',url:co+'hosted-payment'},
    link:{label:'Payment links guide',url:co+'how-to/manage-payment-links'},
    token:{label:'Tokenization guide',url:co+'tokenization-of-payment-data'},
    identity:{label:'3-D Secure guide',url:co+'3ds-authentication'},fraud:{label:'Fraud screening guide',url:co+'fraud-prevention'}
  };
  const op=(method,resource,title,description,tag='')=>({method,resource,title,description,tag});
  const flow=(title,summary,ops,refs,note='',family='Embedded Payments')=>({title,summary,ops,refs,note,family});
  const readClient=()=>op('GET','/clients/{id}','Read the client profile','See the business, its people, and what is still needed.');
  const readBalance=()=>op('GET','/accounts/{id}/balances','Read the account balance','Bring the latest account figures into the platform.');
  const readTransaction=()=>op('GET','/transactions/{id}','Check the transaction','Read the status of an existing money movement.');
  const notices=()=>op('GET','/checkout/notifications','Confirm the outcome','Retrieve order updates from Checkout.');
  const preview=flow('One connected journey','Watch the town first. The operations appear here as each capability comes into the story.',[],[], 'A narrated example. No live API requests are sent.','The big picture');
  const data={
    objective:preview,journey:preview,metaphor:preview,
    application:flow('Give Rosie a profile','City Hall starts a record for the bakery and the people behind it.',[
      op('POST','/clients','Create the business profile','Include the business and its related parties.'),readClient()
    ],['onboarding'],'Creating a profile starts the journey; it does not approve the business.'),
    requirements:flow('Complete the application','Gather the answers and evidence needed before review.',[
      op('GET','/questions','Ask the right questions','Retrieve the questions requested for this client.'),
      op('GET','/documents/{id}/file','Show the terms','Let Rosie read the required attestation documents.'),
      op('PATCH','/clients/{id}','Save answers & attestations','Record her answers and acknowledgement of the terms.'),
      op('POST','/documents','Upload requested evidence','Supply files for any open document requests.'),
      op('POST','/document-requests/{id}/submit','Submit the evidence','Send each completed document request for review.')
    ],['onboarding','documents'],'Only required questions, attestations and document requests apply. Related-party details are updated through /parties/{partyId}.'),
    review:flow('Start the review','The platform requests checks; the provider performs the review.',[
      op('POST','/clients/{id}/verifications','Request verification','Start the required due diligence checks.'),
      op('GET','/clients/{id}','Follow the review','The example is now REVIEW_IN_PROGRESS.')
    ],['onboarding'],'An accepted verification request is not an approval.'),
    missing:flow('Find what is missing','A request for information gives Rosie a way to continue.',[
      op('EVENT','CLIENT_ONBOARDING','Receive an update','An existing subscription reports INFORMATION_REQUESTED.'),
      readClient(),op('GET','/document-requests/{id}','Read the request','Show Rosie which evidence is needed.')
    ],['documents','events'],'The event arrives at your platform. It is not a new outbound API request.'),
    resubmit:flow('Send the missing document','Upload first, then submit the request so review can continue.',[
      op('POST','/documents','Upload the file','Attach the new evidence to the document request.'),
      op('POST','/document-requests/{id}/submit','Submit for review','An upload alone does not complete submission.'),
      op('GET','/clients/{id}','Read the new status','The example returns to REVIEW_IN_PROGRESS.')
    ],['documents','onboarding']),
    approved:flow('Read the decision','Approval arrives after the checks complete.',[
      op('EVENT','CLIENT_ONBOARDING','Receive the decision','An onboarding update announces the result.'),
      op('GET','/clients/{id}','Confirm approval','Rosie and the related parties are approved in this example.')
    ],['onboarding','events'],'There is no “approve client” request for the platform to send.'),
    account:flow('Open Rosie’s account','The approved business gets its own account record.',[
      op('POST','/accounts','Create the account','Use Rosie’s client ID and the LIMITED_DDA category.'),
      op('GET','/accounts/{id}','Read the account','Confirm its identity and account state.')
    ],['accounts'],'Account creation follows onboarding in this story.'),
    ownership:flow('Keep her funds identifiable','The vault is tied to Rosie’s business.',[
      op('GET','/accounts/{id}','Read the account record','Find the client associated with this account.'),readClient()
    ],['accounts','onboarding']),
    balance:flow('See the starting balance','The platform shows the account before any funding arrives.',[readBalance()],['accounts'],'The $0 shown belongs to this example account.'),
    ready:flow('Ready to receive funds','The connection is a visual metaphor for the configured funding journey.',[],['transfer'],'No money moves and no extra API request is needed for this animation beat.'),
    dropin:flow('Pay inside Rosie’s page','The server opens a session; the payment form handles the customer experience.',[
      op('POST','/checkout/intent','Create a checkout session','Describe the $1,500 order and receive a session token.'),
      op('SDK','DropInUI.mount()','Show the payment form','Load the form in Rosie’s page with that session token.'),
      op('SDK','PaymentSuccess','Show the example result','The form announces the payment outcome.'),notices()
    ],['checkout','dropin'],'Checkout success and later account funding are separate events.','Checkout'),
    hosted:flow('Pay on a hosted page','Rosie’s website hands the customer over to the ready-made payment page.',[
      op('POST','/checkout/intent','Create the session','Set up the $2,500 order and receive a redirect URL.'),
      op('BROWSER','Hosted Payment Page','Open the payment page','Redirect the customer to complete payment.'),notices()
    ],['checkout','hosted'],'A return to the shop is not proof that funds have settled.','Checkout'),
    link:flow('Send a way to pay','A shareable link brings the customer to the $4,500 order.',[
      op('POST','/payment-links','Create the payment link','Create a link for the configured product or order.'),
      op('BROWSER','Payment link → Checkout','Open and pay','The link leads the customer into the payment experience.'),notices()
    ],['checkout','link'],'Product and Checkout settings are prepared beforehand.','Checkout'),
    token:flow('Use a token for payment data','A closer look at protection inside the Checkout journey.',[
      op('SERVICE','Tokenization','Replace sensitive details','With the service enabled, Checkout creates a token.'),
      op('GET','/checkout/notifications','Retrieve token updates','Read the token and order notifications.')
    ],['checkout','token'],'This zoom explains the existing payment flow; it does not create another sale. Tokenization requires enrollment.','Checkout'),
    identity:flow('Confirm identity when needed','Checkout can coordinate a 3-D Secure check for the payment.',[
      op('POST','/checkout/intent','Choose authentication options','Set up the session with the applicable 3DS options.','Session setup'),
      op('SERVICE','3-D Secure','Perform the check','The customer completes a challenge when one is required.'),notices()
    ],['checkout','identity'],'A closer look at session setup, not another order. Some payments need no challenge.','Checkout'),
    screen:flow('Assess the payment risk','Screening happens within the configured Checkout flow.',[
      op('SERVICE','Fraud screening','Assess the attempt','The provider checks the payment for signs of risk.'),
      op('SDK','PaymentUnsuccessful','Show the outcome','This separate suspicious attempt is stopped.')
    ],['fraud','dropin'],'No funds are added for the blocked attempt. There is no separate “block visitor” API.','Checkout'),
    settle:flow('Later: allocate the earnings','After settlement, the platform funds Rosie’s limited account.',[
      op('POST','/transactions','Allocate $8,500','Transfer from the platform’s account to Rosie’s account.','TRANSFER'),
      readTransaction(),readBalance()
    ],['transfer','transactions','accounts'],'This is the later Embedded Payments funding step, after Checkout.'),
    linked:flow('Save Rosie’s home bank','The payout destination must belong to Rosie.',[
      op('POST','/recipients','Register the linked account','Provide Rosie’s own external account details.','LINKED_ACCOUNT'),
      op('GET','/recipients/{id}','Check validation','Confirm that the destination is ready for the chosen rails.')
    ],['linked'],'Additional verification can be required before payouts are possible.'),
    rtp:flow('Send three payout instructions','All three examples depart together. RTP is the first to arrive.',[
      op('POST','/transactions','Send $2,000 by RTP','Pay Rosie’s linked bank account.','RTP'),
      op('POST','/transactions','Send $3,000 by ACH','Use the same linked destination.','ACH'),
      op('POST','/transactions','Send $3,500 by wire','Use its wire-enabled bank details.','WIRE')
    ],['payout','transactions'],'Three distinct requests. Arrival times differ; the ledger tracks money in transit.'),
    ach:flow('Follow the scheduled payout','The ACH instruction was sent when the vehicles departed.',[
      op('GET','/transactions/{id}','Track the $3,000 ACH payout','Read the existing transaction’s status.')
    ],['transactions','payout'],'This step follows the same payout; it does not send another $3,000.'),
    wire:flow('Follow the wire payout','The wire instruction is already on its way to Rosie’s bank.',[
      op('GET','/transactions/{id}','Track the $3,500 wire','Read the existing wire transaction’s status.')
    ],['transactions','payout'],'This step follows the same payout; it does not send another $3,500.'),
    delivered:flow('Reconcile the results','Use completion updates and account figures together.',[
      op('EVENT','TRANSACTION_COMPLETED','Receive completion updates','Existing subscriptions report the payout results.'),readTransaction(),readBalance()
    ],['events','transactions','accounts'],'The three example payouts total $8,500. Notifications may arrive out of order.'),
    arrivals:flow('Repeat the onboarding journey','Four new businesses follow the same checks as Rosie.',[
      op('POST','/clients','Create each client profile','One profile per new business and its related parties.','×4'),
      op('FLOW','Onboarding requirements','Complete each application','Questions, evidence and attestations still apply.')
    ],['onboarding'],'Growth does not skip onboarding.'),
    expand:flow('Confirm each business is approved','The montage compresses the reviews before shops appear.',[
      op('POST','/clients/{id}/verifications','Request each review','Submit after the required information is complete.','×4'),
      op('GET','/clients/{id}','Read each decision','Only approved businesses open in this example.','×4')
    ],['onboarding']),
    'new-accounts':flow('An account for each business','Each newly approved client gets its own record.',[
      op('POST','/accounts','Create four client accounts','Repeat account creation for each approved client.','×4'),
      op('GET','/accounts','List the accounts','Bring the client accounts together in the platform.')
    ],['accounts']),
    activity:flow('Repeat the connected journey','An overview of the capabilities the new shops can use.',[
      op('POST','/checkout/intent','Accept another order','Checkout opens the payment experience.','Checkout'),
      op('POST','/transactions','Move funds later','Configured funding and payouts follow their own timelines.','Embedded Payments')
    ],['checkout','transfer','payout'],'This montage illustrates repeated activity. It adds no amounts to Rosie’s example ledger.','Connected capabilities'),
    events:flow('Let the town send updates','Subscriptions are set up beforehand, then events arrive as things change.',[
      op('POST','/webhooks','Subscribe once','Choose client, account and transaction events.','Earlier setup'),
      op('EVENT','Your platform’s callback','Receive status updates','Handle approvals, account creation and payout completion.')
    ],['events'],'An incoming event does not create a new subscription. Handle duplicate deliveries safely.'),
    recap:flow('Bring the records together','Connect the business, its account and its transactions.',[
      op('GET','/clients','List the businesses','See the clients participating in the marketplace.'),
      op('GET','/accounts','List their accounts','Keep each account tied to the right client.'),
      op('GET','/transactions','Review money movement','Reconcile the activity shown by the platform.')
    ],['onboarding','accounts','transactions'],'The town is a metaphor; these are selected operations from the real capabilities.')
  };
  return {data,sources,reviewed:'2026-09-14'};
})();

export default SGOperations;
