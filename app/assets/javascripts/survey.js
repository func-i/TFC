var surveys = null;
var sending = false;

$(function(){
    surveys = new Lawnchair({
        adaptor:'dom',
        table:'surveys'
    }, function(){});

    $('#survey_submit').click(function(){
        store_survey();
    });

    $(window.applicationCache).bind('error', function () {
        console.log('There was an error when loading the cache manifest.');
    });

    $(window).bind("online", send_surveys);

    reset_survey();
    
    setInterval ( "send_surveys()", 60000 );//Send the surveys every 1 minute
});

function reset_survey(){
    $('#first_name').val(''),
    $('#last_name').val(''),
    $('#email').val(''),
    $('#phone_number').val(''),
    $('#postal_code').val(''),
    $('#tfc_opt_in').attr('checked', true),
    $('#rogers_opt_in').attr('checked', true)
}

function store_survey(){    
    surveys.save(
    {
        first_name: $('#first_name').val(),
        last_name: $('#last_name').val(),
        email: $('#email').val(),
        phone_number: $('#phone_number').val(),
        postal_code: $('#postal_code').val(),
        tfc_opt_in: $('#tfc_opt_in').is(':checked'),
        rogers_opt_in: $('#rogers_opt_in').is(':checked'),
        entered_at: Date.now().toString('d-MMM-yyyy HH:mm:ss')
    }, function(){
        $('#thank_you').modal();
        reset_survey();
    });
}

function send_surveys(){
    if(sending)
        return;

    if (!window.navigator.onLine)
        return;

    sending = true;

    surveys.all(function(records){
        if(0 == records.length){
            sending = false;
            return;
        }

        $.ajax({
            type: 'POST',
            url: '/survey',
            data: {
                'surveys': records
            },
            success: function(){
                console.log('surveys sent', records);
                $.each(records, function(index, r){
                    surveys.remove(r, function(){
                        console.log('removed', r)
                    });
                });
            },
            error: function(){
                console.log('error sending surveys', records);
            },
            complete: function(){
                sending = false;
            }
        });
    });    
}