class ReportsController < ApplicationController
  http_basic_authenticate_with(:name => "tfc-reports", :password => "functional-tfc-2012")

  def index
    if params[:from]
      from_date = Date.strptime(params[:from], '%m/%d/%Y').beginning_of_day
    else
      from_date = Survey.order('entered_at ASC').first.entered_at.beginning_of_day
    end

    if params[:to]
      to_date = Date.strptime(params[:to], '%m/%d/%Y').end_of_day
    else
      to_date = Survey.order('entered_at DESC').first.entered_at.end_of_day
    end
    
    @records = Survey.between_dates(from_date, to_date).order_by_date_entered

    @records = @records.with_keywords(params[:q].to_s.strip) if params[:q].present?

    @histogram_data = []

    histo_date = from_date.change(:min => from_date.min.round(-1))
    grouped_data = @records.group_by{|record| 
      min = record.entered_at.min
      min_group = min - min % 10
      record.entered_at.change(:min => min_group)
    }
    while(histo_date < to_date)
      pushed = false

      grouped_data.each do |gd, records|
        if gd == histo_date
          @histogram_data << [histo_date, records.count]
          pushed = true
          break
        end
      end

      @histogram_data << [histo_date, 0] unless pushed

      histo_date += 10.minutes
    end

    params[:from] = from_date.strftime('%m/%d/%Y')
    params[:to] = to_date.strftime('%m/%d/%Y')
  end

  def summary
    from_date = Date.strptime(params[:from], '%m/%d/%Y').beginning_of_day if params[:from]
    to_date = Date.strptime(params[:to], '%m/%d/%Y').end_of_day if params[:to]
    @summaries = Survey.daily_summaries(from_date, to_date)
  end
end