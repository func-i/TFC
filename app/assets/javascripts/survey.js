var surveys = null;
var sending = false;

$(function(){
    surveys = new Lawnchair({
        adaptor:'dom',
        table:'surveys'
    }, function(){});


    $('#survey_submit').click(function(){
        remove_error_state();
        
        if(validate_survey()){
            store_survey();
        }
    });

    $('#survey_clear').click(function(){
        reset_survey();
    });

    $('.control-group input').blur(function(){
        validate_field(this);
    })

    $('#phone_number').mask('(999) 999-9999', {
        placeholder:'#'
    })

    $(window.applicationCache).bind('error', function () {
        console.log('There was an error when loading the cache manifest.');
    });

    $(window).bind("online", send_surveys);

    reset_survey();
    
    setInterval ( "send_surveys()", 60000 );//Send the surveys every 1 minute

    console.log('Im started');

    function logEvent(event) {
      console.log(event.type);
  }

  window.applicationCache.addEventListener('checking',logEvent,false);
  window.applicationCache.addEventListener('noupdate',logEvent,false);
  window.applicationCache.addEventListener('downloading',logEvent,false);
  window.applicationCache.addEventListener('cached',logEvent,false);
  window.applicationCache.addEventListener('updateready',logEvent,false);
  window.applicationCache.addEventListener('obsolete',logEvent,false);
  window.applicationCache.addEventListener('error',logEvent,false);

});

function reset_survey(){
    $('#first_name').val(''),
    $('#last_name').val(''),
    $('#email').val(''),
    $('#phone_number').val(''),
    $('#postal_code').val(''),
    $('#tfc_opt_in').attr('checked', true),
    $('#rogers_opt_in').attr('checked', true)

    remove_error_state();
}

function remove_error_state(){
    $('.control-group').removeClass('error');
}

function validate_survey(){
    all_good = true;
    all_good &= validate_field($('#first_name'));
    all_good &= validate_field($('#last_name'));
    all_good &= validate_field($('#email'));
    all_good &= validate_field($('#phone_number'));
    all_good &= validate_field($('#postal_code'));

    return all_good;
}

function validate_field(field){
    if(!$(field)[0].checkValidity()){
        $(field).closest('.control-group').addClass('error');
        return false;
    }
    else{
        $(field).closest('.control-group').removeClass('error');
        return true;
    }
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