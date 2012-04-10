class Survey < ActiveRecord::Base
  make_searchable :fields => %w{surveys.first_name surveys.last_name surveys.email surveys.postal_code surveys.phone_number}

  def day_entered
    self.entered_at.strftime('%b %e, %Y')
  end

  def time_entered
    self.entered_at.strftime('%l:%H%P')
  end

  scope :daily_summaries, lambda{ |start_date, end_date|
    start_date ||= Survey.order('entered_at ASC').first.entered_at
    end_date ||= Survey.order('entered_at DESC').first.entered_at

    where(:entered_at => (start_date..end_date)).
      group("DATE_TRUNC('day', entered_at)").
      select(
      "DATE_TRUNC('day', entered_at) as entered_date,
        MIN(entered_at - date_trunc('day', entered_at)) as start_time,
        MAX(entered_at - date_trunc('day', entered_at)) as end_time,
        COUNT(*) as num_of_entrees,
        SUM(CASE tfc_opt_in WHEN TRUE THEN 1 ELSE 0 END) as num_of_tfc_opt_ins,
        SUM(CASE rogers_opt_in WHEN TRUE THEN 1 ELSE 0 END) as num_of_rogers_opt_ins
      "
    ).order("DATE_TRUNC('day', entered_at) ASC")
  }

  scope :order_by_date_entered, order('entered_at ASC')

  scope :between_dates, lambda{ |start_date, end_date|
    start_date ||= Survey.order('entered_at ASC').first.entered_at
    end_date ||= Survey.order('entered_at DESC').first.entered_at

    where(:entered_at => (start_date..end_date))
  }

end