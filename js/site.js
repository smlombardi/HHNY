//----------------------------------------------
//--- TRACK LINKS WEB EVENT
//----------------------------------------------
$(function() {
	var anchor = "a.track";

	anchor = $(anchor);
	if (!anchor.length > 0) return false;

	anchor.on({
		click : function(e) {
			trackLink = $(this).attr('title').replace(/ /g,'');
			trackLink = $.trim( trackLink.toLowerCase() );
			emailFormat = "email="+ trackLink +"@yodlesite.com";
			$.ajax({
				type: "POST",
				url: "capture.weblead.ajax",
				data: emailFormat
			});
		// no e.preventDefault() since anchor has _blank
		}
	});
}());

// Cycle Plugin for Banner
$(function() {
    $('.rotate').cycle({
		fx: 'fade', // choose your transition type, ex: fade, scrollUp, shuffle, etc...
		speed: 1000,
		timeout: 4000,
		slides: 'div > img',
		pager: '.cycle-pager'
	});
    var videoCode = '  <iframe width="100%" height="205" src="//www.youtube.com/embed/G3zXRb0EBxk" frameborder="0" allowfullscreen></iframe>';
	$('.video .txtarea a').on("click", function(e) {
		$(this).replaceWith(videoCode);
		e.preventDefault();
	});
});

//Form Defender
;(function($,_) {
	var E, SubmitBtn, Form, ON = on = true, OFF = off = false;

	_.errorCSS        = ".error"; // css class name.
	_.successCSS      = ".success"; // css class name.
	_.submitAction    = "/capture.weblead"; // overwrites html action attribute.
	_.placeHolders    = ON;  // ON or OFF
	_.alertMsg        = ""; // OFF or "message"
	Form              = "form.contactForm"; // css selector.
	SubmitBtn         = ".submit"; // css selector.

	Elems             = {
		"First Name"      : "string, Enter Your First Name",
		"Last Name"      : "string, Enter Your Last Name",
		"Email"     : "email, Enter A Valid Email",
		"Phone"     : "phone, Enter A Valid Phone Number"
	};

	_.swapValuesOnSubmit = {
		"_yodleST" : "x537hd"
	};

_.debug  = off;

//---------------------------------------------------------
// DO NOT MODIFY BELOW THIS LINE //
	_.elems.required  = Elems;
	_.elems.submitBtn = SubmitBtn;
	$(Form).formDefender(_);
}(jQuery,(function() {return {elems:{required:{}}};}()))); 
//----------------------------------------------------------