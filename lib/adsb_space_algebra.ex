defmodule AdsbSpaceAlgebra do
  @moduledoc """
  AdsbSpaceAlgebra keeps the contexts that define your domain
  and business logic.

  Contexts are also responsible for managing your data, regardless
  if it comes from the database, an external API or others.
  """

  def tickle(msg) do
    AdsbSpaceAlgebraWeb.Endpoint.broadcast!(
      "aircraft:updates",
      "aircraft:position",
      %{lat: -41.7667, lon: -72.9, ship: "Endeavour"}
    )
  end

end
