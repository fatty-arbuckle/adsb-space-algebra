defmodule AdsbSpaceAlgebra do
  @moduledoc """
  AdsbSpaceAlgebra keeps the contexts that define your domain
  and business logic.

  Contexts are also responsible for managing your data, regardless
  if it comes from the database, an external API or others.
  """

  def tickle(file_name, delay) do

    AdsbSpaceAlgebraWeb.Endpoint.broadcast!(
      "aircraft:updates",
      "aircraft:position",
      %{icoa: "abcde",
        lon: (-71 - :rand.uniform()),
        lat: (41 + :rand.uniform()),
        altitude: :rand.uniform(30000),
        heading: :rand.uniform(360),
        speed: :rand.uniform(300)
      })

    # # atitude: 42.25397, longitude: -71.51941
    # #   var collection = [
    # #     {"aircraft":{"id":1,"coordinates":[41.28,-74.77],"heading":0,"speed":80}},
    #
    # File.stream!(file_name)
    #   |> Stream.map(fn(msg) ->
    #       AdsbSpaceAlgebra.Network.Client.handle_adsb msg
    #       :timer.sleep(delay)
    #     end)
    #   |> Stream.run
  end

end
