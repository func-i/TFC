class AddRequestLogTable < ActiveRecord::Migration
  def change
    create_table :request_logs do |t|
      t.string :controller
      t.string :action
      t.text :params
      t.timestamps
    end
  end

end
