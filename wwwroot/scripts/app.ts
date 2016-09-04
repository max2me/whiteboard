var director: Director = null;

$(() => {
	director = new Director();
	director.init();

	$('.instructions .toggle').click(() => {
		$('body').toggleClass('show-instructions');
	});
});

