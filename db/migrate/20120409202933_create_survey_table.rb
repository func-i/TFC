class CreateSurveyTable < ActiveRecord::Migration
  def change
    create_table :surveys do |t|
      #t.string :user_title
      t.string :first_name
      t.string :last_name
      t.string :email
      #t.string :province
      #t.string :city
      t.string :postal_code
      t.string :phone_number
      #t.integer :age
      t.boolean :tfc_opt_in
      t.boolean :rogers_opt_in
      t.string :key
    end
  end
end
