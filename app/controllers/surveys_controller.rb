class SurveysController < ApplicationController
  def new
    @survey = Survey.new
    @survey.tfc_opt_in = true
    @survey.rogers_opt_in = true
  end

  def create
    params[:surveys].each do |survey|
      puts survey.inspect
      #Hack, get the second element in each survey array
      if Survey.where(:key => survey[1][:key]).count == 0
        s = Survey.new survey[1]
        s.save
      end
    end

    render :nothing => true
  end

end