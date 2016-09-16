var director: Director = null;

$(() => {
	director = new Director();
	director.init();

	$('body').removeClass('show-instructions');

	$('.instructions .toggle').click(() => {
		$('body').toggleClass('show-instructions');
	});
});

