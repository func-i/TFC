var sending = false;
var stats = false;

$(function(){
    $('#survey_submit').click(function(){
        removeErrorState();
        
        if(validateSurvey()){
            storeSurvey();

            //SHOW THE THANK YOU MODAL
            $('#thank_you').modal();

            //RESET THE FORM
            resetSurvey();

        }
        else{
            incrementSurveyCounter('error_counter', 1);

            var error_surveys = getStoredSurveyArray('error_surveys');
            error_surveys.push(serializeForm());
            storeArray('error_surveys', error_surveys);
        }
    });

    $('#survey_clear').click(function(){
        resetSurvey();
    });

    $('.control-group input').blur(function(){
        validateField(this);
    })

    $('#phone_number').mask('(999) 999-9999', {
        placeholder:'#'
    })

    $(window.applicationCache).bind('error', function () {
        console.log('There was an error when loading the cache manifest.');
    });

    $(window).bind("online", sendSurveys);

    resetSurvey();
    
    setInterval ( "sendSurveys()", 60000 );//Send the surveys every 1 minute

    testSurveyStorage();
});

function resetSurvey(){
    $('#first_name').val(''),
    $('#last_name').val(''),
    $('#email').val(''),
    $('#phone_number').val(''),
    $('#postal_code').val(''),
    $('#tfc_opt_in').attr('checked', true),
    $('#rogers_opt_in').attr('checked', true)

    removeErrorState();
}

function removeErrorState(){
    $('.control-group').removeClass('error');
}

function validateSurvey(){
    all_good = true;
    all_good &= validateField($('#first_name'));
    all_good &= validateField($('#last_name'));
    all_good &= validateField($('#email'));
    all_good &= validateField($('#phone_number'));
    all_good &= validateField($('#postal_code'));

    return all_good;
}

function validateField(field){
    if(!$(field)[0].checkValidity()){
        $(field).closest('.control-group').addClass('error');
        return false;
    }
    else{
        $(field).closest('.control-group').removeClass('error');
        return true;
    }
}

function storeSurvey(){
    //ADD SURVEY TO UNSENT LIST
    var unsent_surveys = getStoredSurveyArray('unsent_surveys');

    unsent_surveys.push(serializeForm());

    try {
        storeArray('unsent_surveys', unsent_surveys);
    } catch (e) {
        if (e == QUOTA_EXCEEDED_ERR) {
            if(clearSpace()){
                storeSurvey(); //CALL STORE SURVEY RECURSIVELY TO RETRY
            }

            return;
        }

        alert('Problem Saving Survey (unknown #' + e + '). Please call Josh Borts @ 647-405-8994');
    }

    //INCREMENT STORAGE COUNTER
    incrementSurveyCounter('stored_counter', 1);
}

function sendSurveys(){
    //RETURN IF ALREADY SENDING
    if(sending)
        return;

    //RETURN IF NOT ONLINE
    if (!window.navigator.onLine)
        return;

    sending = true;

    var unsent_surveys = getStoredSurveyArray('unsent_surveys');

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
            incrementSurveyCounter('sent_counter', unsent_surveys.length);

            //SUCCESSFULLY SENT. MOVE SENT SURVEYS FROM UNSENT TO SENT ARRAYS
            var sent_surveys = getStoredSurveyArray('sent_surveys');
            var new_unsent_surveys = getStoredSurveyArray('unsent_surveys');

            //LOOP THROUG ALL AND SHIFT OUT OF UNSENT AND PUSH ONTO SENT
            var loop_bool = true;
            while(loop_bool){
                var survey1 = unsent_surveys.shift();
                var survey2 = new_unsent_surveys.shift();
                if(undefined == survey1 || undefined == survey2){
                    loop_bool = false;
                }
                else if(survey1.key != survey2.key){
                    alert('Problem Unshifting Surveys. Please Call Josh Borts @ 647-405-8994');
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
    console.log('Clearing Space', localStorage);
    
    //DELETE SURVEY FROM THE ERROR LIST IF EXIST
    var error_surveys = getStoredSurveyArray('error_surveys');
    if(0 == error_surveys.length){
        var sent_surveys = getStoredSurveyArray('sent_surveys');
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
        entered_at: Date.now().toString('d-MMM-yyyy HH:mm:ss'),
        key: generateHexString(24)
    };
}

function getStoredSurveyArray(key){
    var arr = localStorage.getItem(key);
    if(null == arr)
        return [];
    else
        return JSON.parse(arr);
}

function storeArray(key, arr){
    localStorage.setItem(key, JSON.stringify(arr));
}

function incrementSurveyCounter(key, amount){
    var counter = localStorage.getItem(key);
    if(null == counter)
        counter = 0;

    localStorage.setItem(key, parseInt(counter, 10) + amount);
}

function generateHexString(length) {
    var ret = "";
    while (ret < length)
        ret += Math.random().toString(16).substring(2);
    return ret.substring(0,length);
}

function testSurveyStorage(){
    while(sending){ 
        console.log('Wait for sending to finish'); 
        return; 
    }

    sending = true;

    var error_counter = localStorage.getItem('error_counter');
    var error_surveys = localStorage.getItem('error_surveys');
    var sent_counter = localStorage.getItem('sent_counter');
    var sent_surveys = localStorage.getItem('sent_surveys');
    var stored_counter = localStorage.getItem('stored_counter');
    var unsent_surveys = localStorage.getItem('unsent_surveys');
    localStorage.clear();

    $('#first_name').val('Josh');
    $('#last_name').val('Borts');
    $('#email').val('jborts@gmail.com');
    $('#phone_number').val('(647) 405-8994');
    $('#postal_code').val('H3Z2E5');

    var i = 0;
    for(i=0; i < 5000; i++){
        storeSurvey();

        if(0 == i % 100)
            console.log('Looping: ' + i);
    }

    console.log('Finished Testing: ' + localStorage.getItem('stored_counter'));

    localStorage.clear();

    if(error_counter)
        localStorage.setItem('error_counter', error_counter);
    if(error_surveys)
        localStorage.setItem('error_surveys', error_surveys);
    if(sent_counter)
        localStorage.setItem('sent_counter', sent_counter);
    if(sent_surveys)
        localStorage.setItem('sent_surveys', sent_surveys);
    if(stored_counter)
        localStorage.setItem('stored_counter', stored_counter);
    if(unsent_surveys)
        localStorage.setItem('unsent_surveys', unsent_surveys);

    sending = false;
}