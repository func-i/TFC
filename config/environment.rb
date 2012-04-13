# Load the rails application
require File.expand_path('../application', __FILE__)

# Initialize the rails application
Tfc::Application.initialize!

ENV["RAILS_ASSET_ID"] = ""
