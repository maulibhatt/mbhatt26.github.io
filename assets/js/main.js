/*

*/

// Function to handle the employment timeline on-click
function switchJob(event) {
    switch (event.data.job_name) {

        case "freelance":
            $(".past_job_button").removeClass("active");
            $("#freelance_button").addClass("active");
            
            $(".past_job_info").removeClass("active");
            $("#freelance_job_info").addClass("active");
            break;
            
        case "blackberry":
            $(".past_job_button").removeClass("active");
            $("#blackberry_button").addClass("active");
            
            $(".past_job_info").removeClass("active");
            $("#blackberry_job_info").addClass("active");
            break;

        case "accademis":
            $(".past_job_button").removeClass("active");
            $("#accademis_button").addClass("active");

            $(".past_job_info").removeClass("active");
            $("#accademis_job_info").addClass("active");
            break;
    
        case "western":
            $(".past_job_button").removeClass("active");
            $("#western_button").addClass("active");

            $(".past_job_info").removeClass("active");
            $("#western_job_info").addClass("active");
            break;
        default:
            break;
    }

}


(function($) {

	var	$window = $(window),
		$body = $('body'),
		$sidebar = $('#sidebar');

	// Breakpoints.
		breakpoints({
			xlarge:   [ '1281px',  '1680px' ],
			large:    [ '981px',   '1280px' ],
			medium:   [ '737px',   '980px'  ],
			small:    [ '481px',   '736px'  ],
			xsmall:   [ null,      '480px'  ]
		});

	// Hack: Enable IE flexbox workarounds.
		if (browser.name == 'ie')
			$body.addClass('is-ie');

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Forms.

		// Hack: Activate non-input submits.
			$('form').on('click', '.submit', function(event) {

				// Stop propagation, default.
					event.stopPropagation();
					event.preventDefault();

				// Submit form.
					$(this).parents('form').submit();

			});

	// Sidebar.
		if ($sidebar.length > 0) {

			var $sidebar_a = $sidebar.find('a');

			$sidebar_a
				.addClass('scrolly')
				.on('click', function() {

					var $this = $(this);

					// External link? Bail.
						if ($this.attr('href').charAt(0) != '#')
							return;

					// Deactivate all links.
						$sidebar_a.removeClass('active');

					// Activate link *and* lock it (so Scrollex doesn't try to activate other links as we're scrolling to this one's section).
						$this
							.addClass('active')
							.addClass('active-locked');

				})
				.each(function() {

					var	$this = $(this),
						id = $this.attr('href'),
						$section = $(id);

					// No section for this link? Bail.
						if ($section.length < 1)
							return;

					// Scrollex.
						$section.scrollex({
							mode: 'middle',
							top: '-20vh',
							bottom: '-20vh',
							initialize: function() {

								// Deactivate section.
									$section.addClass('inactive');

							},
							enter: function() {

								// Activate section.
									$section.removeClass('inactive');

								// No locked links? Deactivate all links and activate this section's one.
									if ($sidebar_a.filter('.active-locked').length == 0) {

										$sidebar_a.removeClass('active');
										$this.addClass('active');

									}

								// Otherwise, if this section's link is the one that's locked, unlock it.
									else if ($this.hasClass('active-locked'))
										$this.removeClass('active-locked');

							}
						});

				});

		}

	// Scrolly.
		$('.scrolly').scrolly({
			speed: 1000,
			offset: function() {

				// If <=large, >small, and sidebar is present, use its height as the offset.
					if (breakpoints.active('<=large')
					&&	!breakpoints.active('<=small')
					&&	$sidebar.length > 0)
						return $sidebar.height();

				return 0;

			}
		});

	// Spotlights.
		$('.spotlights > section')
			.scrollex({
				mode: 'middle',
				top: '-10vh',
				bottom: '-10vh',
				initialize: function() {

					// Deactivate section.
						$(this).addClass('inactive');

				},
				enter: function() {

					// Activate section.
						$(this).removeClass('inactive');

				}
			})
			.each(function() {

				var	$this = $(this),
					$image = $this.find('.image'),
					$img = $image.find('img'),
					x;

				// Assign image.
					$image.css('background-image', 'url(' + $img.attr('src') + ')');

				// Set background position.
					if (x = $img.data('position'))
						$image.css('background-position', x);

				// Hide <img>.
					$img.hide();

			});

	// Features.
		$('.features')
			.scrollex({
				mode: 'middle',
				top: '-20vh',
				bottom: '-20vh',
				initialize: function() {

					// Deactivate section.
						$(this).addClass('inactive');

				},
				enter: function() {

					// Activate section.
						$(this).removeClass('inactive');

				}
			});

    // Timeline: Professional employement

        $('#freelance_button').on('click', {job_name: "freelance"}, switchJob);
        $('#blackberry_button').on('click', {job_name: "blackberry"}, switchJob);
        $('#accademis_button').on('click', {job_name: "accademis"}, switchJob);
        $('#western_button').on('click', {job_name: "western"}, switchJob);

    // Function that takes in a switch case variable and changes active state when div is clicked

    /* tag cloud variables 
    var entries = [ 
        {label : 'HTML'},
        {label : 'CSS'},
        {label : 'JavaScript'},
        {label : 'Node.js'},
        {label : 'Java'},
        {label : 'C++'},
        {label : 'C'},
        {label : 'Python'},
        {label : 'Express.js'},
        {label : 'React.js'},
        {label : 'Redux'},
        {label : 'PHP'},
        {label : 'SQL'},
        {label : 'MongoDB'},
        {label : 'JSON'},
        {label : 'JQuery'},
        {label : 'C#'}
    ];
    var settings = {
        entries: entries,
        width: 600,
        height: 480,
        radius: '70%',
        radiusMin: 75,
        bgDraw: true,
        bgColor: '#000',
        opacityOver: 1.00,
        opacityOut: 0.05,
        opacitySpeed: 6,
        fov: 800,
        speed:2,
        fontFamily: 'Optima, Courier, sans-serif',
        fontSize: '30',
        fontColor: '#f00',
        fontWeight: 'bold',
        fontStyle: 'normal',
        fontStretch: 'normal',
        fontToUpperCase: false
    };

    $('#skills_div').svg3DTagCloud(settings); */

})(jQuery);

