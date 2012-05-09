class SurveysController < ApplicationController
  before_filter :create_log_request

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
      else
        logger.warn("Duplicate Key: #{survey.inspect}")
      end
    end

    render :nothing => true
  end

  protected

  def create_log_request
    rl = RequestLog.new :controller => params[:controller], :action => params[:action], :params => params.to_s
    rl.save
  end

end