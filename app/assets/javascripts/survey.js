var sending = false;
var stats = false;

$(function(){
    $('#survey_submit').click(function(){
        remove_error_state();
        
        if(validate_survey()){
            store_survey();
        }
        else{
            incrementCounter('error_counter', 1);

            var error_surveys = getStoredArray('error_surveys');
            error_surveys.push(serializeForm());
            storeArray('error_surveys', error_surveys);
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
    //ADD SURVEY TO UNSENT LIST
    var unsent_surveys = getStoredArray('unsent_surveys');

    unsent_surveys.push(serializeForm());

    try {
        storeArray('unsent_surveys', unsent_surveys);
    } catch (e) {
        if (e == QUOTA_EXCEEDED_ERR) {
            if(clearSpace()){
                store_survey(); //CALL STORE SURVEY RECURSIVELY TO RETRY
            }

            return;
        }

        alert('Problem Saving Survey (unknown #' + e + '). Please call Josh Borts @ 647-405-8994');
    }

    //INCREMENT STORAGE COUNTER
    incrementCounter('stored_counter', 1);

    //SHOW THE THANK YOU MODAL
    $('#thank_you').modal();

    //RESET THE FORM
    reset_survey();
}

function send_surveys(){
    //RETURN IF ALREADY SENDING
    if(sending)
        return;

    //RETURN IF NOT ONLINE
    if (!window.navigator.onLine)
        return;

    sending = true;

    var unsent_surveys = getStoredArray('unsent_surveys');

    //RETURN IF NOTHING TO SEND
    if(0 == unsent_surveys.length){
        sending = false;
        return;
    }

    //POST
    $.ajax({
        type: 'POST',
        url: '/survey',
        data: {
            'surveys': unsent_surveys
        },
        success: function(){
            //INCREMENT SENT COUNTER
            incrementCounter('sent_counter', unsent_surveys.length);

            //SUCCESSFULLY SENT. MOVE SENT SURVEYS FROM UNSENT TO SENT ARRAYS
            var sent_surveys = getStoredArray('sent_surveys');
            var new_unsent_surveys = getStoredArray('unsent_surveys');

            //LOOP THROUG ALL AND SHIFT OUT OF UNSENT AND PUSH ONTO SENT
            var loop_bool = true;
            while(loop_bool){
                var survey1 = unsent_surveys.shift();
                var survey2 = new_unsent_surveys.shift();
                if(survey1 != survey2 || undefined == survey1 || undefined == survey2){
                    loop_bool = false;
                }
                else
                    sent_surveys.push(survey1);
            }

            //RESTORE SURVEY ARRAYS
            storeArray('sent_surveys', sent_surveys);
            storeArray('unsent_surveys', new_unsent_surveys);
        },
        error: function(){
            //ERROR SENDING SURVEYS
            console.log('error sending surveys', records);
        },
        complete: function(){
            //ALLOW NEXT BATCH TO BE SENT
            sending = false;
        }
    });
}

function clearSpace(){
    //DELETE SURVEY FROM THE ERROR LIST IF EXIST
    var error_surveys = getStoredArray('error_surveys');
    if(0 == error_surveys.length){
        var sent_surveys = getStoredArray('sent_surveys');
        if(0 == sent_surveys.length){
            alert('Problem Saving Survey (nothing to clear). Please call Josh Borts @ 647-405-8994');
            return false;
        }

        sent_surveys.shift();
        try{
            storeArray('sent_surveys', sent_surveys);
        } catch(e){
            alert('Problem Saving Survey (clearing sent). Please call Josh Borts @ 647-405-8994');//WTF. There is less data now to save
            return false;
        }
    }
    else{
        error_surveys.shift();
        try{
            storeArray('error_surveys', error_surveys);
        } catch(e){
            alert('Problem Saving Survey (clearing errors). Please call Josh Borts @ 647-405-8994');//WTF. There is less data now to save
            return false;
        }
    }

    return true;
}

function serializeForm(){
    return {
        first_name: $('#first_name').val(),
        last_name: $('#last_name').val(),
        email: $('#email').val(),
        phone_number: $('#phone_number').val(),
        postal_code: $('#postal_code').val(),
        tfc_opt_in: $('#tfc_opt_in').is(':checked'),
        rogers_opt_in: $('#rogers_opt_in').is(':checked'),
        entered_at: Date.now().toString('d-MMM-yyyy HH:mm:ss')
    };
}

function getStoredArray(key){
    var arr = localStorage.getItem(key);
    if(null == arr)
        return [];
    else
        return JSON.parse(arr);
}

function storeArray(key, arr){
    localStorage.setItem(key, JSON.stringify(arr));
}

function incrementCounter(key, amount){
    var counter = localStorage.getItem(key);
    if(null == counter)
        counter = 0;

    localStorage.setItem(key, parseInt(counter, 10) + amount);
}