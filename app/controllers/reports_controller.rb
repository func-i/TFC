class ReportsController < ApplicationController
  http_basic_authenticate_with(:name => "tfc-reports", :password => "functional-tfc-2012")

  def index
    
  end
end