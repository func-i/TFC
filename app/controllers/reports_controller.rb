class ReportsController < ApplicationController
  http_basic_authenticate_with(:name => "tfc-reports", :password => "functional-tfc-2012")

  def index
    if params[:from]
      from_date = Date.strptime(params[:from], '%m/%d/%Y').beginning_of_day
    else
      from_date = Survey.order('surveys.entered_at ASC').first.entered_at.beginning_of_day
    end

    if params[:to]
      to_date = Date.strptime(params[:to], '%m/%d/%Y').end_of_day
    else
      to_date = Survey.order('surveys.entered_at DESC').first.entered_at.end_of_day
    end

    @records = Survey.between_dates(from_date, to_date).order_by_date_entered

    @records = @records.with_keywords(params[:q].to_s.strip) if params[:q].present?

    respond_to do |format|
      format.xls { send_xls }
      format.html do
        @histogram_data = []

        histo_date = from_date.change(:min => from_date.min.round(-1))
        grouped_data = @records.group_by { |record|
          min = record.entered_at.min
          min_group = min - min % 10
          record.entered_at.change(:min => min_group)
        }
        while (histo_date < to_date)
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
      end
    end

    params[:from] = from_date.strftime('%m/%d/%Y')
    params[:to] = to_date.strftime('%m/%d/%Y')
  end

  def summary
    if params[:from]
      from_date = Date.strptime(params[:from], '%m/%d/%Y').beginning_of_day
    else
      from_date = Survey.order('surveys.entered_at ASC').first.entered_at.beginning_of_day
    end

    if params[:to]
      to_date = Date.strptime(params[:to], '%m/%d/%Y').end_of_day
    else
      to_date = Survey.order('surveys.entered_at DESC').first.entered_at.end_of_day
    end

    @summaries = Survey.daily_summaries(from_date, to_date)

    params[:from] = from_date.strftime('%m/%d/%Y')
    params[:to] = to_date.strftime('%m/%d/%Y')
  end

  protected

  def send_xls
    generate_xls_from(@records,
                      "survey-#{Time.now.utc.to_i.to_s}.xls", 'Survey Data',
                      ['ID', 'Date', 'Time', 'First Name', 'Last Name', 'Email', 'Phone #', 'Postal Code', 'TFC Opt-in?', 'Rogers Opt-in?']) do |s|
      [
        s.id, s.day_entered, s.time_entered, s.first_name, s.last_name,
        s.email, s.phone_number, s.postal_code,
        s.tfc_opt_in ? 'Y' : 'N', s.rogers_opt_in ? 'Y' : 'N'
      ]
    end
  end

  def generate_xls_from(recs, file_name, sheet_name, headers, &block)
    book = Spreadsheet::Workbook.new
    sheet1 = book.create_worksheet
    sheet1.name = sheet_name

    sheet1.row(0).replace headers
    sheet1.row(0).height = 20

    i = 1
    recs.order("").find_each(:batch_size => 100) do |rec|
      sheet1.row(i).replace block.call(rec)
      i += 1
    end

    format = Spreadsheet::Format.new :color => :blue,
                                     :weight => :bold,
                                     :size => 18
    sheet1.row(0).default_format = format

    book.write "xls/#{file_name}"
    send_file "xls/#{file_name}" #, :disposition => "attachment", :stream => true, :buffer_size => 4096
  end


end