<?php
/*************************************************************/
/*************************************************************/
/*** EDIT THIS AREA ONLY ***/

# Separate emails with commas if using more than one.
$CLIENT_EMAIL    = "Questions@hungryheart.org";

# Domain name must be in this format only: http://www.domain.com
$CLIENT_DOMAIN   = "http://www.hungryheartmanhattanbeach.com" ; 

# Contact Success file
$CONTACT_SUCCESS = "contact_success.html";

/*** END EDITS ***/
/*************************************************************/
/*************************************************************/

// DO NOT EDIT

// Define reply-to data
$userName = Trim(stripslashes($_POST['name']));
$userEmail = Trim(stripslashes($_POST['email']));

$EMAIL_SUBJECT   = "Form Submission";
$EMAIL_HEADER    = "From: " . $userName . " <" . $userEmail . ">";
$REDIRECT        = $CLIENT_DOMAIN . "/" . $CONTACT_SUCCESS;

submitData( array($CLIENT_EMAIL, $EMAIL_SUBJECT, $EMAIL_HEADER) );

function submitData($data) {
	$formData = "";
	$message  = "INFORMATION SUBMITTED ON THE WEBSITE:\n\n";

	foreach ($_POST as $k => $v) {
		$formData .= $k . ": " . $v . "\n";
	} 

	$message .= $formData;
	
	mail($data[0], $data[1], $message, $data[2]);
}

?>

<script type="text/javascript">
	window.location = <?php echo "'".$REDIRECT."'"; ?>
</script>


